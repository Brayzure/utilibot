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
	desc: "Updates the reason for a case",
	long_desc: "Updates the reason for a case",
	usage: "reason <case number> <reason>",
	run: function(m, args, client, context) {
		return new Promise((resolve, reject) => {
			if(args.length < 2) { // I'm an idiot
				return reject(new Error("You must supply both a case number and a reason!"));
			}

			if(isNaN(args[0])) {
				return reject(new Error("First argument must be a case number!"));
			}

			let caseNum = parseInt(args[0]);
			let reason = args.slice(1).join(' ');

			db.getCase(m.channel.guild.id, caseNum).then((caseObject) => {
				caseObject.reason = reason;
				db.editReason(caseObject, client).then(() => {
					return resolve();
				}).catch((err) => {
					return reject(err);
				});
			}).catch((err) => {
				return reject(err);
			})
		});
		
	}
}

module.exports = func;

//(mod, user, guild, channel, type, reason, mid, casenum, client)