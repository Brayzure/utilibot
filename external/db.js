const fs = require('fs');

var functions = {
	post: function(mod, user, guild, channel, type, reason, mid, client, pg) {
		pg.query({
			text: "SELECT casenum FROM audit WHERE guild = $1 ORDER BY casenum DESC LIMIT 1",
			values: [guild]
		}, (err, result) => {
			
			// Something broke, return the error
			if(err) {
				return new Error(err);
			}

			let c = 1;
			let username = `${user.username}#${user.discriminator}`;
			let modUser = `${mod.username}#${mod.discriminator}`;

			// Previous logs exist
			if(result.rows.length) {
				let c = result.rows[0].casenum + 1;
			}

			pg.query({
				text: 'INSERT INTO audit(username,userid,type,timestamp,guildid,moderator,modid,reason,casenum,messageid,duration) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
				values: [username, user.id, type, new Date(), guild.id, modUser, mod.id, reason, casenum, msg, duration]
			}, (err, result) => {

				if(err) {
					return new Error(err);
				}
			});
		})
	}
}

module.exports = functions;