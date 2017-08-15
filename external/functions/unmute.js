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
			let index = roles.indexOf(mutedRole);
			if(index == -1) {
				throw new Error(l.USER_NOT_MUTED);
			}

			roles.splice(index, 1)
			await member.edit({roles: roles});
			await db.setMute(m.channel.guild, m.member, false);
			utils.PM(id, l.YOU_HAVE_BEEN_UNMUTED(m.channel.guild, m.author), client);
			let after = {
				code: 0,
				message: l.USER_UNMUTED
			};
			return after;
		}
		catch(err) {
			throw err;
		}

		/*
		return new Promise((resolve, reject) => {
			if(!args.length) {
				return reject("You need to specify a user to mute, either by mentioning them or using their user ID!");
			}

			let id = args[0].replace(/\D/g,'');
			if(id.length < 16) {
				return reject("You need to specify a user to mute, either by mentioning them or using their user ID!");
			}

			let u = m.channel.guild.members.get(id);

			if(!u) {
				return reject("Could not find that user, make sure you mentioned them or used their user ID!");
			}

			let reason = "";
			if(args.length > 1) {
				reason = args.slice(1).join(' ');
			}

			let str = `You have been muted in **${m.channel.guild.name}** by **${m.author.username}**.`;
			if(reason) {
				str += `\nA reason was provided: ${reason}`;
			}
			str += "\nConsider messaging the moderator for a more detailed explanation.";

			utils.PM(id, str, client);

			db.getNextCaseNumber(m.channel.guild.id).then((num) => {
				db.postAudit(m.author, u, m.channel.guild, m.channel, "Mute", reason, num, 0, client, context.serverConfig[m.channel.guild.id])
				.then(() => {
					return resolve();
				}).catch((err) => {
					return reject(err);
				});
			}).catch((err) => {
				reject(err);
			});
		});
		*/
		
	}
}

module.exports = func;

//(mod, user, guild, channel, type, reason, mid, casenum, client)