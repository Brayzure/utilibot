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
	run: async function(m, args, client, context) {
		try {
			let latency = m.channel.guild.shard.latency;
			let shardID = m.channel.guild.shard.id;
			await m.channel.createMessage(`Pong! (Latency: ${latency}ms | Shard ${shardID})`);
		}
		catch (err) {
			return err;
		}
	}
}

module.exports = func;