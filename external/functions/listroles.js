const fs = require('fs');
const Postgres = require('pg');
const Eris = require('eris');
const Constants = require('../constants.js');
const utils = require('../utils.js');

var func = {
	perm: Constants.Roles.Admin,
	hidden: false,
	guildOnly: true,
	aliases: ["lr"],
	desc: "List the roles in a server",
	long_desc: "Lists all roles in a server, along with their IDs",
	usage: "eval <command>",
	run: async function(m, args, client, context) {
		try {
			let str = "**Server Roles**";
			m.channel.guild.roles.forEach((role) => {
				str += `\n${role.name}   [${role.id}] `;
			});
			let msg = utils.split_message(str);
			if(msg.length > 1) {
				// Code to post multiple messages, probably from utils
			}
			else {
				await m.channel.createMessage(msg[0]);
			}
		}
		catch (err) {
			return err;
		}		
	}
}

module.exports = func;