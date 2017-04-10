const fs = require('fs');
const Postgres = require('pg');
const utils = require('./utils.js');

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
	postAudit: function(mod, user, guild, channel, type, reason, casenum, duration, client, sc) {
		return new Promise((resolve, reject) => {
			let caseObject = {};

			let username = `${user.username}#${user.discriminator}`;
			let modUser = `${mod.username}#${mod.discriminator}`;

			pg.query({
				text: 'INSERT INTO audit(username,userid,type,timestamp,guildid,moderator,modid,reason,casenum,messageid,duration) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
				values: [username, user.id, type, new Date(), guild.id, modUser, mod.id, reason, casenum, "", duration]
			}, (err, result) => {

				if(err) {
					reject(err);
				}

				if(result.rows.length) {
					caseObject = result.rows[0];
				}

				// Maybe pass a case object?
				let str = `Created new **${type}**! Case number: **${casenum}**.`;
				if(!reason) {
					str += `\nPlease run \`${sc.prefix}reason ${casenum} <reason>\`.`;
				}
				channel.createMessage(str).then((m) => {
					functions.postAuditMessage(guild.id, caseObject, client).then(() => {
						return resolve();
					}).catch((err) => {
						if(err) {
							return reject(err);
						}
						else {
							return reject();
						}
					});
				}).catch((err) => {
					// Do something? Probably not
				});
			});
		});
	},
	getNextCaseNumber: function(guildID) {
		return new Promise((resolve, reject) => {
			pg.query({
				text: "SELECT casenum FROM audit WHERE guildid = $1 ORDER BY casenum DESC LIMIT 1",
				values: [guildID]
			}, (err, result) => {
				if(err) {
					return reject(err);
				}

				return resolve(result.rows.length ? result.rows[0].casenum + 1 : 1);
			});
		});
	},
	postAuditMessage: function(guildID, caseObject, client) {
		return new Promise((resolve, reject) => {
			functions.getConfig(guildID).then((c) => {
				// Modlog channel set, post to it
				if(c.modlog) {
					let co = caseObject; // Typing is hard
					let color = {
						'Ban': 0xFF0000,
						'Kick': 0xFFA500,
						'Mute': 0xFFFF00,
						'Warn': 0x00FF00
					}
					let emb = {
						title: `Case: ${co.casenum} | ${co.type}`,
						description: `**Reason**: ${(co.reason?co.reason:'\`No reason listed!\`')}`,
						color: color[co.type],
						author: {
							name: `${co.username} (${co.userid})` // duh
						},
						footer: {
							text: `Date: ${new Date(co.timestamp).toString()} | Moderator: ${co.moderator}`
						}
					}
					if(co.messageid) {
						// Edit the message
						client.editMessage(c.modlog, co.messageid, {embed: emb}).then((m) => {
							return resolve();
						}).catch((err) => {
							// Message deleted or channel moved, create new message
							client.createMessage(c.modlog, {embed: emb}).then((m) => {
								// Update db with message id
								// WITH DEDICATED PATCH FUNCTION
								// Nevermind lol
								pg.query({
									text: `UPDATE audit SET messageid = $1 WHERE caseid = $2`
									values: [m.id, co.caseid]
								}, (err, res) => {
									if(err) {
										return reject(err);
									}
									else {
										return resolve();
									}
								});
							}).catch((err) => {
								return reject(new Error("Could not post audit message."))
							});
						});
					}
					else {
						// Create new message
						client.createMessage(c.modlog, {embed: emb}).then((m) => {
							// Update db with message id
							pg.query(`UPDATE audit SET messageid = ${m.id} WHERE caseid = ${co.caseid}`, (err, res) => {
								if(err) {
									return reject(err);
								}
								else {
									return resolve();
								}
							});
						}).catch((err) => {
							return reject(new Error("Could not post audit message."))
						});
					}
				}
				else {
					return resolve();
				}
			}).catch((err) => {
				return reject(`Failed to retrieve config for server. Error: ${err.stack}`);
			});
		});
	},
	getConfig: function(guildid) {
		return new Promise((resolve, reject) => {
			pg.query(`SELECT * FROM server_config${guildid?" WHERE id='"+guildid+"'":""}`, (err, res) => {
				if(err) {
					return reject(err);
					process.exit();
				}
				let serverConfig = {};
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
				if(guildid) {
					return resolve(serverConfig[res.rows[0].id]);
				}
				else {
					return resolve(serverConfig);
				}
			});
		});
	},
	postConfig: function(guild, info) {
		return new Promise((resolve, reject) => {
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
			pg.query({
				text: "INSERT INTO server_config VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) ON CONFLICT (id) DO NOTHING",
				values: [guild.id, info.announce, info.modlog, info.verbose, info.literal, info.name, info.admin, info.mod, info.exempt, info.verboseIgnore, JSON.stringify(info.verboseSettings), JSON.stringify(info.filterSettings), info.muted, info.blacklist]
			}, (err, res) => {
				if(err) {
					return reject(err);
				}
				return resolve(info);
			});
		});
	}
}

module.exports = functions;