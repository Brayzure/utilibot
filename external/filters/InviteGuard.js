var filter = {
	run: function(m) {
		if(~m.content.indexOf('discord.gg')) {
			return true;
		}
		return false;
	}
}

module.exports = filter;