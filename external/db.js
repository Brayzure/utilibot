const fs = require('fs');
const Postgres = require('pg');
const utils = require('./utils.js');

// Authentication Information
const auth = require('../src/auth.json');

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
	post: function(mod, user, guild, channel, type, reason, mid, casenum, client) {
		return new Promise((resolve, reject) => {
			let username = `${user.username}#${user.discriminator}`;
			let modUser = `${mod.username}#${mod.discriminator}`;

			pg.query({
				text: 'INSERT INTO audit(username,userid,type,timestamp,guildid,moderator,modid,reason,casenum,messageid,duration) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
				values: [username, user.id, type, new Date(), guild.id, modUser, mod.id, reason, casenum, msg, duration]
			}, (err, result) => {

				if(err) {
					reject(err);
				}

				// Maybe pass a case object?
				resolve();
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
	}
}

module.exports = functions;