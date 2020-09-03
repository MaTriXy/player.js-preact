const path = require('path');

module.exports = function(config) {
	if (config.devServer) {
		config.devServer.setup = (app) => {
			app.use(require('./src/server/routes').default);
		}
	}
}