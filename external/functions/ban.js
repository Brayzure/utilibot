const fs = require('fs');
const Postgres = require('pg');
const Eris = require('eris');
const Constants = require('../constants.js');
const utils = require('../utils.js');
const db = require('../db.js');

var func = {
	perm: Constants.Roles.ModPlus,
	hidden: false,
	guildOnly: true,
	aliases: ["b"],
	desc: "Bans a user",
	long_desc: "Bans a user from the server",
	usage: "ban <user mention/id> <reason>",
	run: async function(m, args, client, context) {
		try {
			if(!args.length) {
				return new Error("You need to specify a user to ban, either by mentioning them or using their user ID!");
			}

			let id = args[0].replace(/\D/g,'');
			if(id.length < 16) {
				return new Error("You need to specify a user to ban, either by mentioning them or using their user ID!");
			}

			let u = m.channel.guild.members.get(id);

			if(!u) {
				return new Error("Could not find that user, make sure you mentioned them or used their user ID!");
			}

			let reason = "";
			if(args.length > 1) {
				reason = args.slice(1).join(' ');
			}

			let str = `You have been banned from **${m.channel.guild.name}** by **${m.author.username}**.`;
			if(reason) {
				str += `\nA reason was provided: ${reason}`;
			}
			// Not sure anything else is needed
			// str += "\nYou may rejoin at any time.\nConsider messaging the moderator for a more detailed explanation.";

			await utils.PM(id, str, client);
			await u.ban(1);

			let num =  await db.getNextCaseNumber(m.channel.guild.id);
			await db.postAudit(m.author, u, m.channel.guild, m.channel, "Ban", reason, num, 0, client, context.serverConfig[m.channel.guild.id]);
		}
		catch (err) {
			return err;
		}		
	}
}

module.exports = func;

//(mod, user, guild, channel, type, reason, mid, casenum, client)