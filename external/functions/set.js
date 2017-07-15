const fs = require('fs');
const Constants = require('../constants.js');
const utils = require('../utils.js');
const db = require('../db.js');

var func = {
	perm: Constants.Roles.Admin,
	hidden: true,
	guildOnly: false,
	aliases: ["s"],
	desc: "Adds an entry to the given list",
	long_desc: "Adds an entry to the given list",
	usage: "add <list> <entry>",
	run: async function(m, args, client, context) {
		try {
			let prefix = context.serverConfig[m.channel.guild.id].prefix;
			let l = context.locale;
			let sc = context.serverConfig[m.channel.guild.id];
			let after;

			if(args.length < 2) {
				throw new Error(l.NOT_ENOUGH_ARGUMENTS(prefix, this.usage));
			}

			let option = args[0].toLowerCase();

			switch(option) {
				case "muted":
					let role = m.channel.guild.roles.get(args[1]);
					if(!role) {
						throw new Error(l.NO_ROLE_FOUND);
					}

					sc.muted = role.id;
					db.postConfig(m.channel.guild, sc);
					after = {
						code: 0,
						message: l.SET_MUTED_ROLE(role)
					}
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