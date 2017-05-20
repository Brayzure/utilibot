const fs = require('fs');
const Postgres = require('pg');
const Eris = require('eris');
const Constants = require('../constants.js');
const utils = require('../utils.js');

var func = {
	perm: Constants.Roles.Staff,
	hidden: false,
	guildOnly: true,
	aliases: ["p"],
	desc: "Pings the bot",
	long_desc: "Pings the bot and displays current shard's latency",
	usage: "ping",
	run: function(m, args, client, context) {
		return new Promise((resolve, reject) => {
			m.channel.createMessage(`Pong! (Latency: ${m.channel.guild.shard.latency}ms)`).then((m) => {
				return resolve();
			}).catch((e) => {
				return reject();
			});
		});
	}
}

module.exports = func;