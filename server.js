const fs = require('fs');
const path = require('path');

const { appLogger } = require('./src/utils/logger');
const app = require('./src/app');
const defaultConfigLoc = path.join(__dirname, `/config/config.default.json`)
const configLoc = (!fs.existsSync(path.join(__dirname, `/config/config.json`))) ? defaultConfigLoc : path.join(__dirname, `/config/config.json`);
const CONFIG = JSON.parse(fs.readFileSync(configLoc, 'utf-8'), 'utf8');

const server = app.listen(CONFIG.app_port, () => {
    const port = server.address().port;
    appLogger.info(`----- listening on port: ${port}`);
    appLogger.info(`----- version: ${CONFIG.verion}`);
});
