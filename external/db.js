const fs = require('fs');
const Postgres = require('pg');
const utils = require('./utils.js');
const Constants = require('./constants.js');

// Authentication Information
const auth = require('../src/auth.json');
const config = require('../src/config.json');

var pg = new Postgres.Client({
	user: auth.pg_user,
	password: auth.pg_password,
	database: auth.pg_db
});

pg.connect(function(err) {
	if (err) throw err;

	utils.console("Connected to Postgres database!");
	//imp();
});

var functions = {
	postAudit: async function(mod, user, guild, channel, type, reason, casenum, duration, client, sc) {
		try {
			let caseObject = {};

			let username = `${user.username}#${user.discriminator}`;
			let modUser = `${mod.username}#${mod.discriminator}`;

			let result = await pg.query({
				text: 'INSERT INTO audit(username,userid,type,timestamp,guildid,moderator,modid,reason,casenum,messageid,duration) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
				values: [username, user.id, type, new Date(), guild.id, modUser, mod.id, reason, casenum, "", duration]
			});

			if(result.rows.length) {
				caseObject = result.rows[0];
			}

			// Maybe pass a case object?
			let str = `Created new **${type}**! Case number: **${casenum}**.`;
			if(!reason) {
				str += `\nPlease run \`${sc.prefix}reason ${casenum} <reason>\`.`;
			}
			
			let msg = await channel.createMessage(str);
			await functions.postAuditMessage(guild.id, caseObject, client);
		}
		catch (err) {
			return err;
		}
	},
	getNextCaseNumber: async function(guildID) {
		try {
			let result = await pg.query({
				text: "SELECT casenum FROM audit WHERE guildid = $1 ORDER BY casenum DESC LIMIT 1",
				values: [guildID]
			});

			return resolve(result.rows.length ? result.rows[0].casenum + 1 : 1);
		}
		catch (err) {
			return err;
		}
	},
	editReason: async function(caseObject, client) {
		try {
			let result = await pg.query({
				text: `UPDATE audit SET reason = $1 WHERE caseid = $2`,
				values: [caseObject.reason, caseObject.caseid]
			});

			await functions.postAuditMessage(caseObject.guildid, caseObject, client);
		}
		catch (err) {
			return err;
		}
	},
	getCase: async function(guildID, casenum) {
		try {
			let result = await pg.query({
				text: "SELECT * FROM audit WHERE guildid = $1 AND casenum = $2",
				values: [guildID, casenum]
			});

			if(!result.rows.length) {
				return new Error("EMPTY_CASE_NUM");
			}

			return result.rows[0];
		}
		catch (err) {
			return err;
		}
	},
	postAuditMessage: async function(guildID, caseObject, client) {
		try {
			let c = await functions.getConfig(guildID);

			if(c.modlog) {
				let co = caseObject; // Typing is hard
				let emb = {
					title: `Case: ${co.casenum} | ${co.type}`,
					description: `**Reason**: ${(co.reason?co.reason:'\`No reason listed!\`')}`,
					color: Constants.CaseColors[co.type],
					author: {
						name: `${co.username} (${co.userid})`
					},
					footer: {
						text: `Date: ${new Date(co.timestamp).toString()} | Moderator: ${co.moderator}`
					}
				}
				if(co.messageid) {
					// Edit the message
					try {
						await client.editMessage(c.modlog, co.messageid, {embed: emb});
					}
					catch (err) {
						let m = await client.createMessage(c.modlog, {embed: emb});

						await pg.query({
							text: `UPDATE audit SET messageid = $1 WHERE caseid = $2`,
							values: [m.id, co.caseid]
						});
					}
				}
				else {
					// Create new message
					let m = await client.createMessage(c.modlog, {embed: emb});

					await pg.query({
						text: `UPDATE audit SET messageid = $1 WHERE caseid = $2`,
						values: [m.id, co.caseid]
					});
				}
			}
		}
		catch (err) {
			return err;
		}
	},
	getConfig: async function(guildid) {
		try {
			let result = await pg.query(`SELECT * FROM server_config${guildid?" WHERE id='"+guildid+"'":""}`);
			let serverConfig = {};
			for(let row of result.rows) {
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
			if(guildid) {
				return serverConfig[result.rows[0].id];
			}
			else {
				return serverConfig;
			}
		}
		catch (err) {
			return err;
		}
	},
	postConfig: async function(guild, info) {
		try {
			// No info passed, generate default settings
			if(!info) {
				info = {
					announce: "",
					modlog: "",
					verbose: "",
					literal: config.global_prefix,
					name: guild.name,
					admin: [],
					mod: [],
					exempt: [],
					verboseIgnore: [],
					verboseSettings: "",
					filterSettings: "",
					muted: "",
					blacklist: []
				};
			}

			// Construct query
			let q = "INSERT INTO server_config VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) ON CONFLICT (id) ";
			q += "DO UPDATE SET announce = $2, modlog = $3, verboselog = $4, prefix = $5, name = $6, admin = $7, mod = $8, exempt = $9, ";
			q += "verbose_ignore = $10, verbose_settings = $11, filter_settings = $12, muted = $13, blacklist = $14"
			await pg.query({
				text: q,
				values: [guild.id, info.announce, info.modlog, info.verbose, info.literal, info.name, info.admin, info.mod, info.exempt, info.verboseIgnore, JSON.stringify(info.verboseSettings), JSON.stringify(info.filterSettings), info.muted, info.blacklist]
			});

			return info;
		}
		catch (err) {
			return err;
		}
	},
	postMember: async function(member, info) {
		try {
			// No info passed, create defaults
			if(!info) {
				info = {
					usernames: [`${member.user.username}#${member.user.discriminator}`],
					nicknames: [],
					joinDates: [new Date(member.joinedAt)],
					avatar: member.avatarURL,
					muted: false
				}
				if(member.nickname) {
					info.nicknames.push(member.nickname);
				}
			}

			try {
				let memberInfo = await functions.getMember(member);
				return memberInfo;
			}
			catch (err) {
				// Construct query
				// On conflict, that means member has rejoined a community it previously left
				// So, append date to the array
				let q = "INSERT INTO members VALUES($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id, guildid) DO ";
				q += "UPDATE SET join_dates = members.join_dates || $5"
				await pg.query({
					text: q,
					values: [member.user.id, member.guild.id, info.nicknames, info.usernames, info.join_dates, info.avatar, info.muted]
				});
				return info;
			}
		}
		catch (err) {
			return err;
		}
	},
	getMember: async function(member) {
		try {
			let q = "SELECT * FROM members WHERE id = $1 AND guildid = $2";
			let result = await pg.query({
				text: q,
				values: [member.user.id, member.guild.id]
			});

			if(!res.rows.length) {
				return new Error(`No member found with ID: ${member.user.id} and Guild ID: ${member.guild.id}`);
			}

			return result.rows[0];
		}
		catch (err) {
			return err;
		}
	},
	postNickname: async function(member) {
		try {
			let q = "UPDATE members SET nicknames = array_append(nicknames, $1) WHERE id = $2 AND guildid = $3";
			await pg.query({
				text: q,
				values: [member.nick, member.user.id, member.guild.id]
			});
		}
		catch (err) {
			return err;
		}
	},
	postUsername: async function(member) {
		try {
			let q = "UPDATE members SET usernames = array_append(usernames, $1) WHERE id = $2 AND guildid = $3";
			let username = `${member.user.username}#${member.user.discriminator}`;
			await pg.query({
				text: q,
				values: [username, member.user.id, member.guild.id]
			});
		}
		catch (err) {
			return err;
		}
	}
}

module.exports = functions;