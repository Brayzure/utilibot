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
pg.connect(function(err) {
	if (err) throw err;

	log('console', "Connected to Postgres database!");
	//imp();
});

/*
* EVENTS
*/
client.on('shardReady', (id) => {
	if(client.ready) {
		log('botlog', `Shard ${id} ready!`);
	}
	else {
		log('console', `Shard ${id} ready!`);
	}
});

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

client.on('shardResume', (id) => {
	log('botlog', `Shard ${id} has successfully resumed!`);
});

client.on('ready', () => {
	log('debug', "Discord client connected!");
	// Get configs from database and cache them
	pg.query('SELECT * FROM server_config', (err, res) => {
		if(err) {
			log('botlog', `Could not load the server configuration. Here's what went wrong: ${err}`);
			process.exit();
		}
		for(let row of res.rows) {
			serverConfig[row.id] = {
				name: row.name,
				announce: row.announce,
				modlog: row.modlog,
				verbose: row.verboselog,
				prefix: row.prefix,
				admin: row.admin,
				mod: row.mod,
				exempt: row.exempt,
				blacklist: row.blacklist,
				verboseIgnore: row.verbose_ignore,
				verboseSettings: JSON.parse(row.verbose_settings),
				filterSettings: JSON.parse(row.filter_settings),
				muted: row.muted
			}
		}
		ready = true;
		log('botlog', `Client has finished launching ${client.shards.size} shards!`);
	});
});

client.on('messageCreate', (m) => {
	// Client not ready, let's avoid strange behavior
	if(!ready) return;

	// Probably a webhook, ignore them
	if(m.author.discriminator === '0000') return;

	// PM not from the bot itself
	if(!m.channel.guild && m.author.id !== client.user.id) {
		let str = `New PM\nAuthor: ${m.author.username} (${m.author.id})\nContent: ${m.content}`;
		log('pm', str);
	}

	// Not a PM
	else {
		// Get permissions of user
		let p = permissions(m.channel.guild, m.channel, m.author);
		// console.log(exempt(m.channel.guild, m.channel, m.member));

		let sc = serverConfig[m.channel.guild.id];
		// Return if no config found. TODO: Have it create new config
		if(!sc) {
			return;
		}

		// Detect and parse commands
		if(m.content.startsWith(sc.prefix)) {
			let temp = m.content.split(' ');
			let cmd = temp[0].slice(lit.length);
			let args = temp.slice(1);
		}
	}
});

function log(location, content) {
	if(location === 'botlog') {
		if(ready && config.error_channel) {
			client.createMessage(config.error_channel, {embed: {
				description: content
			}}).catch(console.log);
		}
		console.log(content);
	}
	if(location === 'info') {
		if(ready && config.log_channel) {
			client.createMessage(config.log_channel, {embed: {
				description: content
			}}).catch(console.log);
		}
		console.log(content);
	}
	if(location === 'pm') {
		if(ready && config.pm_channel) {
			client.createMessage(config.pm_channel, {embed: {
				description: content
			}}).catch(console.log);
		}
		console.log(content);
	}
	if(location === 'console') {
		console.log(content);
	}
	if(location === 'debug' && config.debug) {
		console.log(`Debug: ${content}`);
	}
}

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

function canIMod(guild) {
	let perms = permissions(guild, guild.channels.get(guild.id), client.user);
	let neededPerms = ['kickMembers', 'banMembers', 'manageMessages'];
	let mod = true;
	for(let i=0; i<neededPerms.length && mod; i++) {
		if(!~perms.indexOf(neededPerms[i])) mod = false;
	}
	return mod;
}

function permissions(guild, channel, user) {
	let obj = {};
	let roles = guild.members.get(user.id).roles;
	if(!roles) return []; // Failed to find member info, assume no permissions

	// Determine channel overrides
	channel.permissionOverwrites.forEach((over) => {
		if(roles.includes(over.id) || over.id === guild.id) {
			let j = over.json;
			for(let key in j) {
				if(j.hasOwnProperty(key) && (!obj.hasOwnProperty(key) || j[key])) {
					obj[key] = j[key];
				}
			}
		}
	});
	
	// Determine global permissions
	let r = guild.roles.get(guild.id); // Default permissions
	let j = r.permissions.json;
	for(let key in j) {
		if(j.hasOwnProperty(key) && !obj.hasOwnProperty(key) && j[key]) {
			obj[key] = true;
		}
	}
	for(let i in roles) { // Permissions from roles
		r = guild.roles.get(roles[i]);
		j = r.permissions.json;
		for(let key in j) {
			if(j.hasOwnProperty(key) && j[key]) {
				obj[key] = true;
			}
		}
	}

	// Convert object to array
	let arr = [];
	for(let key in obj) {
		if(obj.hasOwnProperty(key) && obj[key]) {
			arr.push(key);
		}
	}
	if(user.id === auth.dev_id) {
		arr.push('manageServer', 'developer');
	}
	return arr;
}

function exempt(guild, channel, member, perms) {
	// Bots exempt by default
	if(member.user.bot) {
		return true;
	}

	let g = getRole(guild, channel, member, perms);
	
	return !!g;
}

function getRole(guild, channel, member, perms) {
	let sc = serverConfig[guild.id];
	if(!sc) {
		return ROLES.MEMBER;
	}
	// TODO: Combine into one loop
	for(role of member.roles) {
		if(~sc.admin.indexOf(role)) {
			return ROLES.ADMIN;
		}
	}
	for(role of member.roles) {
		if(~sc.mod.indexOf(role)) {
			return ROLES.MOD;
		}
	}
	for(role of member.roles) {
		if(~sc.exempt.indexOf(role)) {
			return ROLES.EXEMPT;
		}
	}
	if(!perms) {
		perms = permissions(guild, channel, member.user);
	}
	if(~perms.indexOf("manageServer")) {
		return ROLES.ADMIN;
	}
	if(~perms.indexOf("banMembers")) {
		return ROLES.MOD;
	}
	return ROLES.MEMBER;
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

const ROLES = {
	MEMBER: 0,
	EXEMPT: 1,
	MOD: 2,
	ADMIN: 3,
	DEVELOPER: 4
};