const winston = require('winston');
const path = require('path');

const logDir = 'logs';

const formats = {
    console: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
            return `${timestamp} ${level}: ${message} ${metaStr}`;
        })
    ),

    file: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json()
    )
};

const config = {
    development: {
        level: 'debug',
        handleExceptions: true,
        maxFiles: '14d',
        maxSize: '20m'
    },
    production: {
        level: 'info',
        handleExceptions: true,
        maxFiles: '30d',
        maxSize: '50m'
    }
};

const env = process.env.NODE_ENV || 'development';
const currentConfig = config[env];

const logger = winston.createLogger({
    level: currentConfig.level,
    format: formats.file,
    transports: [
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            ...currentConfig
        }),

        new winston.transports.File({
            filename: path.join(logDir, 'warn.log'),
            level: 'warn',
            ...currentConfig
        }),

        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            ...currentConfig
        }),

        new winston.transports.File({
            filename: path.join(logDir, 'http.log'),
            level: 'http',
            ...currentConfig
        })
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logDir, 'exceptions.log'),
            ...currentConfig
        })
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logDir, 'rejections.log'),
            ...currentConfig
        })
    ]
});

if (env !== 'production') {
    logger.add(new winston.transports.Console({
        format: formats.console,
        level: 'debug'
    }));
}

const httpLogger = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.http({
            message: `${req.method} ${req.url} ${res.statusCode}`,
            duration: `${duration}ms`,
            userAgent: req.get('user-agent') || '',
            ip: req.ip
        });
    });

    next();
};


const logError = (message, error) => {
    if (error && typeof error === 'object') {
        console.error(message, JSON.stringify({
            message: error.message || 'Unknown error',
            code: error.code,
            stack: error.stack,
            ...error
        }));
    } else {
        console.error(message, error);
    }
};


const logWarning = (message, context = {}) => {
    logger.warn({
        message,
        ...context
    });
};

const logInfo = (message, context = {}) => {
    logger.info({
        message,
        ...context
    });
};

module.exports = {
    logger,
    httpLogger,
    logError,
    logWarning,
    logInfo
};
