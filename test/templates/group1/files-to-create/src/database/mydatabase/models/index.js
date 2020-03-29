module.exports = require("fs").readdirSync(__dirname).filter(file => {
	return file !== __filename;
}).map(file => {
	return require(file);
});