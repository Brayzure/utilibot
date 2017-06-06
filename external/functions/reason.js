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
	aliases: ["r"],
	desc: "Updates the reason for a case",
	long_desc: "Updates the reason for a case",
	usage: "reason <case number> <reason>",
	run: async function(m, args, client, context) {
		try {
			if(args.length < 2) {
				return new Error("You must supply both a case number and a reason!");
			}

			if(isNaN(args[0])) {
				return new Error("First argument must be a case number!");
			}


			let caseNum = parseInt(args[0]);
			let reason = args.slice(1).join(' ');

			let caseObject = await db.getCase(m.channel.guild.id, caseNum);
			if(!(context.roleMask & Constants.Roles.Admin) && m.author.id != caseObject.modid) {
				return new Error("You must be an admin or the moderator that performed the action to edit the reason!");
			}

			caseObject.reason = reason;
			await db.editReason(caseObject, client);
		}
		catch (err) {
			return err;
		}		
	}
}

module.exports = func;

//(mod, user, guild, channel, type, reason, mid, casenum, client)