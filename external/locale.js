const fs = require('fs');

const localeList = require('../locale/index.json');
var locale = {};
for(lang of localeList) {
	try {
		let tempLang = require(`../locale/${lang}.js`);
		locale[lang] = tempLang
	}
	catch(e) {
		console.log(`Error loading '${lang}' locale. Here's what went wrong: ${e.toString()}`);
	}
}

module.exports = locale;