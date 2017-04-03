const fs = require('fs');
const Postgres = require('pg');
const Eris = require('eris');
const Constants = require('../constants.js');
const utils = require('../utils.js');
const db = require('../db.js');

var func = {
	perm: Constants.Roles.Staff,
	hidden: false,
	guildOnly: true,
	desc: "Warns a user",
	long_desc: "Adds a warning to a user's log",
	usage: "warn <user mention/id> <reason>",
	run: function(m, args, client, context) {
		return new Promise((resolve, reject) => {
			if(!args.length) {
				return reject("You need to specify a user to warn, either by mentioning them or using their user ID!");
			}

			let id = args[0].replace(/\D/g,'');
			if(id.length < 16) {
				return reject("You need to specify a user to warn, either by mentioning them or using their user ID!");
			}

			let u = m.channel.guild.members.get(id);

			if(!u) {
				return reject("Could not find that user, make sure you mentioned them or used their user ID!");
			}

			let reason = "";
			if(args.length > 1) {
				reason = args.slice(1).join(' ');
			}

			db.getNextCaseNumber(m.channel.guild.id).then((num) => {
				db.postAudit(m.author, u, m.channel.guild, m.channel, "Warn", reason, num, 0, client, context.serverConfig[m.channel.guild.id])
				.then(() => {
					resolve();
				}).catch((err) => {
					reject(err);
				});
			}).catch((err) => {
				reject(err);
			});
		});
		
	}
}

module.exports = func;

//(mod, user, guild, channel, type, reason, mid, casenum, client)