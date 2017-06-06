const fs = require('fs');
const Postgres = require('pg');
const Eris = require('eris');
const Constants = require('../constants.js');
const utils = require('../utils.js');

var func = {
	perm: Constants.Roles.Developer,
	hidden: true,
	guildOnly: false,
	aliases: ["e"],
	desc: "Evaluates a command",
	long_desc: "Evaluates a command",
	usage: "eval <command>",
	run: async function(m, args, client, context) {
		try {
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
			await m.channel.createMessage({embed: emb});
		}
		catch (err) {
			return err;
		}
	}
}

module.exports = func;