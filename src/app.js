const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const timeout = require('connect-timeout');
const morgan = require('morgan');
const rfs = require('rotating-file-stream');
const appRoot = require('app-root-path');

const v1routes = require('./routes/v1');

const logDirectory = path.join(appRoot.toString(), '/log');
const defaultConfigLoc = path.join(appRoot.toString(), `/config/config.default.json`)
const configLoc = (!fs.existsSync(path.join(appRoot.toString(), `/config/config.json`))) ? defaultConfigLoc : path.join(appRoot.toString(), `/config/config.json`);
const CONFIG = JSON.parse(fs.readFileSync(configLoc, 'utf-8'), 'utf8');
const { appLogger } = require('./utils/logger');
const MONGO_STR = CONFIG.mongo_str

mongoose.Promise = global.Promise;
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

const app = express()
// app.use(morgan('combined', {
// 	stream: rfs('access.log', {
// 		interval: '7d', // rotate 7 days
// 		path: logDirectory
// 	})
// }));
app.use(morgan('combined', { stream: appLogger.stream }))
app.use(helmet());
app.use(timeout('60s'));
app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({parameterLimit: 100000, limit: '10mb', extended: true}));

const dbPromise = mongoose.connect(MONGO_STR, {
	useNewUrlParser: true
}).then((conn) => {
	return conn;
}, (err) => {
	if (err != null) {
		appLogger.error("failed to connect to mongodb", {error: err});
	}
	return null;
});

dbPromise.then((db) => {
	if (db) {
		appLogger.info("connected to mongodb");
		app.use('/api/v1', v1routes)
	}
	app.get('/', (req, res) => res.send('yay~~~'));
	app.use((req, res)=>{res.status(404).end();});
})

module.exports = app;