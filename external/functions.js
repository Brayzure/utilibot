const fs = require('fs');
const Postgres = require('pg');
const Eris = require('eris');
const Constants = require('./constants.js');
const utils = require('./utils.js');

var functions = {
	eval: {
		perm: Constants.Roles.Developer,
		hidden: true,
		desc: "Evaluates a command",
		long_desc: "Evaluates a command",
		usage: "eval <command>",
		run: function(m, args, client, context) {
			if(m.author.id !== context.config.dev_id) {
				return new Error("Must be developer to use this command.");
			}

			let exp = args.join(' ');
			let emb = {
				color: 0x008000
			}
			let desc;
			try {
				let result = eval(exp);
				desc = `**In:**\n\`\`\`js\n${exp}\n\`\`\`**Out:**\n\`\`\`js\n${result}\n\`\`\``;
			}
			catch(e) {
				desc = `**In:**\n\`\`\`js\n${exp}\n\`\`\`**Out:**\n\`\`\`js\n${e.toString()}\n\`\`\``;
				emb.color = 0xED1C24;
			}
			emb.description = desc;
			m.channel.createMessage({embed: emb}).catch((e) => {
				return e;
			});
		}
	},
	listroles: {
		perm: Constants.Roles.Admin,
		hidden: false,
		desc: "List the roles in a server",
		long_desc: "Lists all roles in a server, along with their IDs",
		usage: "eval <command>",
		run: function(m, args, client, context) {
			let str = "**Server Roles**";
			m.channel.guild.roles.forEach((role) => {
				str += `\n${role.name}   [${role.id}] `;
			});
			let msg = utils.split_message(str);
			if(msg.length > 1) {
				// Code to post multiple messages, probably from utils
			}
			else {
				m.channel.createMessage(msg[0]).catch((e) => {
					return e;
				});
			}
		}
	}
}

module.exports = functions;