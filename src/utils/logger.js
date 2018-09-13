const fs = require('fs');
const winston = require('winston');
const moment = require('moment-timezone');
require('winston-daily-rotate-file');

const logDir = "./log"
if(!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const DailyRotateFileTransport = new (winston.transports.DailyRotateFile)({
    // filename: 'app_%DATE%.log',
    filename: './log/app_%DATE%.log',
    // filename: [logDir, 'app_%DATE%.log'].join("/"),
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
});
const myFormat = winston.format.printf(info => {
    const ts = moment(info.timestamp).tz('UTC').format('YYYY-MM-DD HH:mm:ss z')
    return `${ts} ${info.level}:[${info.label}]  ${info.message}`;
});
// const fileOptions = {
//         level: 'info',
//         filename: [logDir, 'app.log'].join("/"),
//         timestamp: true,
//         handleExceptions: true,
//         json: false,
//         maxsize: 10, // 5MB
//         maxFiles: 5,
//         colorize: false,
// }
const formatOptions = (labelName) => {
    return winston.format.combine(
        winston.format.colorize(),
        // winston.format.align(),
        winston.format.label({ label: labelName }),
        winston.format.timestamp(),
        winston.format.splat(),
        myFormat
    )
};
const consoleOptions = (labelName) => {
    return {
        level: 'debug',
        handleExceptions: true,
        json: true,
        colorize: true,
        format:  formatOptions(labelName)
    }
};

winston.loggers.add('app', {
    format: formatOptions('app'),
    transports: [
        new winston.transports.Console(consoleOptions('app')),
        // new winston.transports.File(fileOptions),
        DailyRotateFileTransport
    ]
});

winston.loggers.get('app').stream = {
    write: function(message, encoding) {
        winston.loggers.get('app').info(message);
    },
};

module.exports = {
    appLogger: winston.loggers.get('app'),
    testLogger: winston.loggers.get('test'),
};
