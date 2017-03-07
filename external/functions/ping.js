const fs = require('fs');
const Postgres = require('pg');
const Eris = require('eris');
const Constants = require('../constants.js');
const utils = require('../utils.js');

var func = {
	perm: Constants.Roles.Staff,
	hidden: false,
	desc: "Pings the bot",
	long_desc: "Pings the bot and displays current shard's latency",
	usage: "ping",
	run: function(m, args, client, context) {
		m.channel.createMessage(`Pong! (Latency: ${m.channel.guild.shard.latency}ms)`).catch();
	}
}

module.exports = func;