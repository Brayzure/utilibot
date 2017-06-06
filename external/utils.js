const fs = require('fs');
const auth = require('../src/auth.json');
const config = require('../src/config.json');

var functions = {
	split_message: function(content) {
		if(content.length < 2000) {
			return [content];
		}

		// Too long, let's try and split it at a logical place
		else {
			// Attempt to split on newlines
			// TODO: Search for multiple consecutive newlines first
			let split = content.split('\n');
			let progress = '';
			let lines = [];
			for(line in split) {
				// I sure hope no lines are 1999 characters or longer
				if(progress.length + line.length > 1998) {
					lines.push(progress);
					progress = '';
				}
				progress = progress + line;
			}
			lines.push(progress);
			return lines;
		}
	},
	randInt: function(min, max) {
	    return Math.floor(Math.random() * (max - min + 1)) + min;
	},
	debug: function(content) {
		if(config.debug) {
			console.log(`Debug: ${content}`);
		}
	},
	console: function(content) {
		console.log(content);
	},
	permissions: function(guild, channel, user) {
		let obj = {};
		let member = guild.members.get(user.id);
		if(!member) return [];
		let roles = guild.members.get(user.id).roles;
		if(!roles) return []; // Failed to find member info, assume no permissions

		// Determine channel overrides
		channel.permissionOverwrites.forEach((over) => {
			if(roles.includes(over.id) || over.id === guild.id) {
				let j = over.json;
				for(let key in j) {
					if(j.hasOwnProperty(key) && (!obj.hasOwnProperty(key) || j[key])) {
						obj[key] = j[key];
					}
				}
			}
		});
		
		// Determine global permissions
		let r = guild.roles.get(guild.id); // Default permissions
		let j = r.permissions.json;
		for(let key in j) {
			if(j.hasOwnProperty(key) && !obj.hasOwnProperty(key) && j[key]) {
				obj[key] = true;
			}
		}
		for(let i in roles) { // Permissions from roles
			r = guild.roles.get(roles[i]);
			j = r.permissions.json;
			for(let key in j) {
				if(j.hasOwnProperty(key) && j[key]) {
					obj[key] = true;
				}
			}
		}

		// Convert object to array
		let arr = [];
		for(let key in obj) {
			if(obj.hasOwnProperty(key) && obj[key]) {
				arr.push(key);
			}
		}
		if(user.id === auth.dev_id) {
			arr.push('manageServer', 'developer');
		}
		return arr;
	},
	canIMod: function(guild, user) {
		let perms = functions.permissions(guild, guild.channels.get(guild.id), user);
		let neededPerms = ['kickMembers', 'banMembers', 'manageMessages'];
		let mod = true;
		for(let i=0; i<neededPerms.length && mod; i++) {
			if(!~perms.indexOf(neededPerms[i])) mod = false;
		}
		return mod;
	},
	PM: async function(userID, message, client) {
		// Don't care if they receive the PM or not
		// RESOLVE ALL OF IT
		try {
			let c = await client.getDMChannel(userID);
			await c.createMessage(message);
		}
		catch (err) {
			return;
		}		
	}
}

module.exports = functions;