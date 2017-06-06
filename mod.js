/*
* EXTERNAL MODULES
*/
const fs = require('fs');
const Postgres = require('pg');
const Eris = require('eris');

/*
* FILE LOADING
*/
// Authentication Information
const auth = require('./src/auth.json');
// Bot Behavior
const config = require('./src/config.json');
log('debug', "Loaded external files!");

/*
* CUSTOM MODULES
*/
const Constants = require('./external/constants.js');
const db = require('./external/db.js');
const utils = require('./external/utils.js');
const functionList = require('./external/functions/index.json');
var functions = {};
for(func of functionList) {
	try {
		let tempFunc = require(`./external/functions/${func}.js`);
		functions[func] = tempFunc;
		log('debug', `Loaded '${func}' command.`);
		for(alias of tempFunc.aliases) {
			functions[alias] = tempFunc;
			log('debug', `Loaded '${func}' command alias '${alias}'.`);
		}
	}
	catch(e) {
		log('console', `Error loading '${func}' command. Here's what went wrong: ${e.toString()}`);
	}
}
const filterList = require('./external/filters/index.json');
var filters = {};
for(filter of filterList) {
	try {
		let tempFilter = require(`./external/filters/${filter}.js`);
		filters[filter] = tempFilter;
		log('debug', `Loaded '${filter}' filter.`);
	}
	catch(e) {
		log('console', `Error loading '${filter}' filter. Here's what went wrong: ${e.toString()}`);
	}
}

/*
* SESSION VARIABLES
*/
// Users currently in the process of being moderated
var modMutex = {};
// Cached guild configs
var serverConfig = {};
// Client readiness
var ready = false;

log('debug', "Creating clients...");
/*
* CLIENT CREATION AND CONNECTION
*/
var client = new Eris(auth.token, {
	getAllUsers: true,
	disableEvents: {
		PRESENCE_UPDATE: true
	},
	maxShards: config.shards
});

var pg = new Postgres.Client({
	user: auth.pg_user,
	password: auth.pg_password,
	database: auth.pg_db
});

log('debug', "Connecting clients...");
client.connect();

/*
* EVENTS
*/
// Log errors, but don't crash
if(config.persist) {
	// Something broke
	process.on('uncaughtException', (e) => {
		log('botlog', e.stack);
	});

	// A promise got rejected, and we weren't there to comfort it :(
	process.on('unhandledRejection', (reason, p) => {
		log('botlog', `Unhandled Rejection: ${reason}`);
	});
}

// A single shard has readied
client.on('shardReady', (id) => {
	if(client.ready) {
		log('botlog', `Shard ${id} ready!`);
	}
	else {
		log('console', `Shard ${id} ready!`);
	}
});

// A single shard has disconnected
client.on('shardDisconnect', (err, id) => {
	let str;
	if(err) {
		str = `Shard ${id} disconnected. Here's what it said: ${err}`;
	}
	else {
		str = `Shard ${id} disconnected without errors.`;
	}
	log('botlog', str);
});

// A single shard has resumed
client.on('shardResume', (id) => {
	log('botlog', `Shard ${id} has successfully resumed!`);
});

// All shards readied
client.on('ready', async function() {
	log('debug', "Discord client connected!");
	// Get configs from database and cache them
	let c = await db.getConfig();
	log('debug', `Retrieved server config for ${Object.keys(c).length} servers!`);
		
	// Backfill config
	let guildErrors = false;
	let memberErrors = false;
	let newGuilds = 0;
	let newMembers = 0;

	for(guild of client.guilds) {
		let g = guild[1];
		if(!c[g.id]) {
			try {
				let cfg = await db.postConfig(g);
				log('debug', `Generated new config for missing guild: ${g.name}`);
				serverConfig[g.id] = cfg;
				newGuilds++;
			}
			catch (err) {
				guildErrors = true;
				log('console', err.toString());
			}
		}

		for(member of g.members) {
			let mem = member[1];
			try {
				await db.postMember(mem);
				newMembers++;
			}
			catch (err) {
				memberErrors = true;
				log('console', err.toString());
			}
		}
	}
	serverConfig = c;
	ready = true;

	if(guildErrors) {
		log('botlog', "There were errors creating new guild configs, please review console.");
	}

	if(memberErrors) {
		log('botlog', "There were errors creating new member data, please review console.");
	}
	log('botlog', `Client has finished initialization! ${newGuilds} new guilds and ${newMembers} new members.`);
});

// New message detected
client.on('messageCreate', (m) => {
	// Client not ready, let's avoid strange behavior
	if(!ready) return;

	// System message?
	if(!m.author) {
		console.log(m);
		return;
	}

	// Probably a webhook, ignore them
	if(m.author.discriminator === '0000') return;

	// PM not from the bot itself
	if(!m.channel.guild && m.author.id !== client.user.id) {
		let str = `New PM\nAuthor: ${m.author.username} (${m.author.id})\nContent: ${m.content}`;
		// Detect and parse commands
		if(m.content.startsWith(config.global_prefix)) {
			let roleMask = 0;
			if(m.author.id === config.dev_id) {
				roleMask |= Constants.Roles.Developer;
			}
			processCommand(m, 1, roleMask);
		}
		log('pm', str);
	}

	// Not a PM
	else if(m.channel.guild){
		// Get permissions of user
		let p = utils.permissions(m.channel.guild, m.channel, m.author);
		// console.log(exempt(m.channel.guild, m.channel, m.member));

		let sc = serverConfig[m.channel.guild.id];
		// Return if no config found. TODO: Make it more descriptive
		if(!sc) {
			db.postConfig(m.channel.guild).then((c) => {
				log('debug', `Generated new config for missing guild: ${m.channel.guild.name}`);
				serverConfig[m.channel.guild.id] = c;
			}).catch((err) => {
				log('console', err.toString());
			});
			return;
		}
		
		// Needed for both commands and the filters
		let roleMask = getRoleMask(m.channel.guild, m.channel, m.member);

		// Detect and parse commands
		if(m.content.startsWith(config.global_prefix)) {
			processCommand(m, 0, roleMask);
		}

		let flag = processFilters(m, ["InviteGuard"])
		if(flag) {
			// Filter triggered, do something about it!
		}
	}
});

// Message was deleted, but not bulk deleted
client.on('messageDelete', (m) => {
	if(!m.author || !m.channel.guild || !ready) {
		return;
	}
	let str = `**Channel**: <#${m.channel.id}> **${m.author.username}#${m.author.discriminator}'s** message was deleted. Content:\n`;
	str += m.cleanContent;
	verbose(m.channel.guild, 'MessageDelete', str);
});

// We joined a new guild!
client.on('guildCreate', (g) => {
	let b = 0;
	g.members.forEach((mem) => {
		if(mem.user.bot) {
			b++;
		}
	});
	log("info", `I have joined **${g.name}**! Member data: **${g.members.size}** members and **${b}** bots. Total guilds: **${client.guilds.size}**`);
});

// A guild member got banned
client.on('guildBanAdd', (guild, user) => {
	let str = `**${user.username}#${user.discriminator}** was banned from the guild. Total members: **${guild.memberCount}**`;
	verbose(guild, "UserMod", str);
});

// A guild member got unbanned
client.on('guildBanRemove', (guild, user) => {
	let str = `**${user.username}#${user.discriminator}** was unbanned from the guild.`;
	verbose(guild, "UserMod", str);
});

// A user has joined this guild
client.on('guildMemberAdd', (guild, member) => {
	let str = `**${member.user.username}#${member.user.discriminator}** joined the guild. Total members: **${guild.memberCount}**`;
	verbose(guild, "UserJoin", str);

	// Add member to guild config
	// TODO: Make logs more descriptive
	db.postMember(member).then(() => {
		log('debug', "Added member to database.");
	}).catch((err) => {
		log('botlog', `Error adding member to database. ${err.toString()}`)
	});
});

// A guild member has left the guild
client.on('guildMemberRemove', (guild, member) => {
	if(!member) return;
	let str = `**${member.user.username}#${member.user.discriminator}** left the guild, or was kicked. Total members: **${guild.memberCount}**`;
	verbose(guild, "UserLeave", str);
});

// A guild member has been changed
client.on('guildMemberUpdate', (guild, newMember, oldMember) => {
	let str = '';
	let username = `${newMember.user.username}#${newMember.user.discriminator}`;
	if(!oldMember || !newMember) {
		return;
	}
	
	// Nickname was changed, not necessarily by the member themselves
	if(newMember.nick !== oldMember.nick) {
		let oldNick = (oldMember.nick) ? oldMember.nick : 'None';
		let newNick = (newMember.nick) ? newMember.nick : 'None';
		str = `**${username}** changed their nickname from **${oldNick}** to **${newNick}**.`;
		if(newMember.nick) {
			db.postNickname(newMember).then(() => {
				log('debug', `Added nickname '${newNick}' to member '${username}'`);
			}).catch((err) => {
				log('botinfo', `Error adding nickname to database. ${e.toString()}`);
			});
		}
	}

	// Roles were changed
	else if(newMember.roles.length != oldMember.roles.length) {
		let oldRoles = [];
		let newRoles = [];
		for(let i=0; i<oldMember.roles.length; i++) {
			oldRoles.push(guild.roles.get(oldMember.roles[i]).name);
		}
		for(let i=0; i<newMember.roles.length; i++) {
			newRoles.push(guild.roles.get(newMember.roles[i]).name);
		}
		str += `**${username}'s** roles have changed.`;
		str += `\nOld: \`${oldRoles.length ? oldRoles.join(', ') : 'None'}\``;
		str += `\nNew: \`${newRoles.length ? newRoles.join(', ') : 'None'}\``;
	}

	// Not quite sure what happened
	else {
		return;
	}
	verbose(guild, "UserUpdate", str);
});

// Overall command handler
async function processCommand(m, pm, roleMask) {
	let temp = m.content.split(' ');
	let cmd = temp[0].slice(config.global_prefix.length);
	if(cmd === "override" || cmd === "o" && roleMask & Constants.Roles.Developer) {
		cmd = args[0];
		args = args.slice(1);
		roleMask = Constants.Roles.All;
	}
	// Command doesn't exist, abort!
	if(!functions[cmd]) {
		return;
	}

	// Inform user that command must be run in a guild
	if(functions[cmd].guildOnly && pm) {
		try {
			await m.channel.createMessage({
				embed: {
					color: 0xED1C24,
					description: "You must run this command in a guild!"
				}
			});
		}
		catch (err) {
			console.log(err);
		}
		return;
	}

	// Parse commands
	let args = temp.slice(1);
	console.log(cmd, args, roleMask); // Remove before full deployment
	if(roleMask & functions[cmd].perm) {
		
		// Acknowledge message with check mark reaction if possible
		ack(m);
		let context = {
			config: config,
			serverConfig: serverConfig,
			modMutex: modMutex,
			roleMask: roleMask
		};

		// Run command and handle response
		try {
			functions[cmd].run(m, args, client, context);
		}
		catch (err) {
			if(err) {
				try {
					await m.channel.createMessage({
						embed: {
							color: 0xED1C24,
							description: err.toString()
						}
					});
				}
				catch (err) {
					console.log(err);
				}
			}
		}
	}
}

// Overall filter processor
function processFilters(m, order) {
	for(filter of order) {
		if(filters[filter].run(m)) {
			return filter;
		}
	}
	return false;
}

// Server log handler
function verbose(guild, type, content) {
	// No log posting
	if(config.silent) {
		return;
	}

	// Logs of this type are disabled, or channel is not set
	if(!serverConfig[guild.id].verbose || !serverConfig[guild.id].verboseSettings[type]) {
		return;
	}

	let emote = {
		"UserJoin": ":white_check_mark:",
		"UserLeave": ":x:",
		"MessageDelete": ":pencil:",
		"UserUpdate": ":person_with_pouting_face:",
		"UserMod": ":hammer:"
	}

	let time = new Date().toTimeString().slice(0,8);
	let str = `${emote[type]} \`[${time}]\` ${content.replace('@', '@\u200b')}`;
	client.createMessage(serverConfig[guild.id].verbose, str).catch(console.log);
}

// Message reaction function
function ack(m) {
	m.addReaction('✅').then(() => {
		setTimeout(() => {
			m.removeReaction('✅').catch(() => {});
		}, 15e3);
	}).catch(() => {});
	// Don't really care if it fails
}

// Private bot log handler
function log(location, content) {
	// Possibly bad stuff happening
	if(location === 'botlog') {
		if(ready && config.bot_channel) {
			client.createMessage(config.bot_channel, {embed: {
				description: content
			}}).catch(console.log);
		}
		console.log(content);
	}

	// Unimportant info
	if(location === 'info') {
		if(ready && config.log_channel) {
			client.createMessage(config.log_channel, {embed: {
				description: content
			}}).catch(console.log);
		}
		console.log(content);
	}

	// New PM received
	if(location === 'pm') {
		if(ready && config.pm_channel) {
			client.createMessage(config.pm_channel, {embed: {
				description: content
			}}).catch(console.log);
		}
		console.log(content);
	}

	// Console output
	if(location === 'console') {
		console.log(content);
	}

	// Debug output
	if(location === 'debug' && config.debug) {
		console.log(`Debug: ${content}`);
	}
}

// Incomplete timestamp function
function timestamp(time) {
	let d;
	if(time) {
		d = new Date(time);
	}
	else {
		d = new Date();
	}
	let str = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`
}

// Determines if a user is exempt from moderation
function exempt(guild, channel, member, perms) {
	// Bots exempt by default
	if(member.user.bot) {
		return true;
	}

	let g = getRole(guild, channel, member, perms);
	
	return !!g;
}

// Gets the bitwise permission mask for a member
function getRoleMask(guild, channel, member, perms) {
	let mask = 0;
	if(member.user.id === config.dev_id) {
		mask |= Constants.Roles.Developer
	}
	let sc = serverConfig[guild.id];
	if(!sc) {
		return 0;
	}
	// TODO: Combine into one loop
	for(role of member.roles) {
		if(~sc.admin.indexOf(role)) {
			mask |= Constants.Roles.Admin;
		}
	}
	for(role of member.roles) {
		if(~sc.mod.indexOf(role)) {
			mask |= Constants.Roles.Mod;
		}
	}
	for(role of member.roles) {
		if(~sc.exempt.indexOf(role)) {
			mask |= Constants.Roles.Exempt;
		}
	}
	if(!perms) {
		perms = utils.permissions(guild, channel, member.user);
	}
	if(~perms.indexOf("manageServer") && !sc.admin.length) {
		mask |= Constants.Roles.Admin;
	}
	if(~perms.indexOf("banMembers") && !sc.mod.length) {
		mask |= Constants.Roles.Mod;
	}
	return mask;
}

// Import legacy config file to Postgres
function imp() {
	log('console', "Importing legacy configuration file...");
	let c = require('./config.json').servers;
	for(let id in c) {
		if(c.hasOwnProperty(id)) {
			let o = c[id];
			pg.query({
				text: "INSERT INTO server_config VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) ON CONFLICT (id) DO NOTHING",
				values: [id, o.announce, o.modlog, o.verbose, o.literal, o.name, o.admin, o.mod, o.exempt, o.verboseIgnore, JSON.stringify(o.verboseSettings), JSON.stringify(o.filterSettings), o.mute, o.blacklist]
			}, (err, res) => {
				if(err) {
					console.log(err);
					return;
				}
			});
		}
	}
}

function shutdown() {
	// Things to do before we quit
	process.exit()
}

