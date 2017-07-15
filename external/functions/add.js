const fs = require('fs');
const Constants = require('../constants.js');
const utils = require('../utils.js');
const db = require('../db.js');

var func = {
	perm: Constants.Roles.Admin,
	hidden: true,
	guildOnly: false,
	aliases: ["a"],
	desc: "Adds an entry to the given list",
	long_desc: "Adds an entry to the given list",
	usage: "add <list> <entry>",
	run: async function(m, args, client, context) {
		try {
			let prefix = context.serverConfig[m.channel.guild.id].prefix;
			let l = context.locale;
			let sc = context.serverConfig[m.channel.guild.id];

			if(args.length < 2) {
				throw new Error(l.NOT_ENOUGH_ARGUMENTS(prefix, this.usage));
			}

			let list = args[0].toLowerCase();
			let role = m.channel.guild.roles.get(args[1]);
			let after;

			switch(list) {
				case 'a':
				case 'admin':
					if(!role) {
						throw new Error(l.NO_ROLE_FOUND);
					}
					if(sc.admin.includes(role.id)) {
						throw new Error(l.ROLE_ON_LIST);
					}
					sc.admin.push(role.id);
					await db.postConfig(m.channel.guild, sc);
					after = {
						code: 0,
						message: l.ADDED_TO_LIST(role.name, "admin")
					}
					break;
				case 'm':
				case 'mod':
					if(!role) {
						throw new Error(l.NO_ROLE_FOUND);
					}
					if(sc.mod.includes(role.id)) {
						throw new Error(l.ROLE_ON_LIST);
					}
					sc.mod.push(role.id);
					await db.postConfig(m.channel.guild, sc);
					after = {
						code: 0,
						message: l.ADDED_TO_LIST(role.name, "mod")
					}
					break;
				case 's':
				case 'sub':
				case 'submod':
					if(!role) {
						throw new Error(l.NO_ROLE_FOUND);
					}
					if(sc.subMod.includes(role.id)) {
						throw new Error(l.ROLE_ON_LIST);
					}
					sc.subMod.push(role.id);
					await db.postConfig(m.channel.guild, sc);
					after = {
						code: 0,
						message: l.ADDED_TO_LIST(role.name, "subMod")
					}
					break;
				case 'e':
				case 'exempt':
					if(!role) {
						throw new Error(l.NO_ROLE_FOUND);
					}
					if(sc.exempt.includes(role.id)) {
						throw new Error(l.ROLE_ON_LIST);
					}
					sc.exempt.push(role.id);
					await db.postConfig(m.channel.guild, sc);
					after = {
						code: 0,
						message: l.ADDED_TO_LIST(role.name, "exempt")
					}
					break;
				case 'b':
				case 'blacklist':
					break;
				default:
					throw new Error(l.NO_LIST_FOUND);
					break;
			}

			return after;
		}
		catch (err) {
			throw err;
		}
	}
}

module.exports = func;