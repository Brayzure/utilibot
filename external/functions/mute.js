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
	aliases: ["m"],
	desc: "Mutes a user",
	long_desc: "Adds the Muted role to the specified user",
	usage: "mute <user mention/id> <reason>",
	run: async function(m, args, client, context) {
		try {
			let l = context.locale;
			let guildID = m.channel.guild.id;
			let mutedRole = m.channel.guild.roles.get(context.serverConfig[guildID].muted);
			let prefix = context.serverConfig[guildID].prefix;

			if(!mutedRole) {
				throw new Error(l.NO_MUTED_ROLE(prefix));
			}
			mutedRole = mutedRole.id;

			if(!args.length) {
				throw new Error(l.NOT_ENOUGH_ARGUMENTS(prefix, this.usage));
			}

			let id = args[0].replace(/\D/g,'');
			let member = m.channel.guild.members.get(id);

			if(!member) {
				throw new Error(l.NO_MEMBER);
			}

			let roles = member.roles;
			if(roles.includes(mutedRole)) {
				throw new Error(l.USER_ALREADY_MUTED);
			}

			roles.push(mutedRole);
			await member.edit({roles: roles});
			await db.setMute(m.channel.guild, m.member, true);
			let str = l.YOU_HAVE_BEEN_MUTED(m.channel.guild, m.author);
			if(args.length > 1) {
				let reason = args.slice(1).join(' ');
				str +=  "\n" + l.REASON(reason);
			}
			str += "\n" + l.CONTACT_MODERATOR;
			utils.PM(id, str, client);
			let after = {
				code: 0,
				message: l.USER_MUTED
			};
			return after;
		}
		catch(err) {
			throw err;
		}
	}
}

module.exports = func;

//(mod, user, guild, channel, type, reason, mid, casenum, client)