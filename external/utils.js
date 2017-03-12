const fs = require('fs');

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
	debug: function(content) {
		if(config.debug) {
			console.log(`Debug: ${content}`);
		}
	},
	console: function(content) {
		console.log(content);
	}
}

module.exports = functions;