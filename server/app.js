require('dotenv').config();
const express = require('express');
const events = require('events');

const http = require('http');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const { corsOptions } = require('./src/config/cors.config');
const csurf = require('csurf');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const {httpLogger, logger} = require('./src/utils/logger');
const router = require('./src/routes');
const errorHandler = require('./src/middlewares/error.middleware');

const PORT = process.env.PORT || 5000;

const requiredEnvVars = {
    DATABASE_URL: 'URL базы данных',
    JWT_SECRET: 'Секретный ключ JWT',
    REFRESH_TOKEN_SECRET: 'Секретный ключ для refresh token',
    BASE_URL: 'Базовый URL приложения',
};

Object.entries(requiredEnvVars).forEach(([key, desc]) => {
    if (!process.env[key]) {
        logger.error(`Отсутствует обязательная переменная окружения: ${key} (${desc})`);
        process.exit(1);
    }
});


events.EventEmitter.defaultMaxListeners = 15;

const app = express();
const server = http.createServer(app);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

const uploadsDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');

try {
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, {recursive: true});
        fs.mkdirSync(path.join(uploadsDir, 'products'), {recursive: true});
        fs.mkdirSync(path.join(uploadsDir, 'avatars'), {recursive: true});
        logger.info('Созданы директории для загрузки файлов', {path: uploadsDir});
    }
} catch (error) {
    logger.error('Ошибка при создании директорий для загрузки', {
        error: error.message,
        path: uploadsDir,
    });
    process.exit(1);
}

app.use('/uploads', express.static(uploadsDir));


const helmetConfig = {
    crossOriginResourcePolicy: {policy: 'cross-origin'},
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'"].concat((process.env.CORS_ORIGIN || '').split(',')),
            imgSrc: ["'self'", 'data:', 'blob:', `${process.env.BASE_URL}/uploads/*`],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            fontSrc: ["'self'", 'data:'],
            objectSrc: ["'none'"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    referrerPolicy: {policy: 'strict-origin-when-cross-origin'},
    permittedCrossDomainPolicies: {permittedPolicies: 'none'}
};

app.use(helmet(helmetConfig));

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.MAX_REQUEST_LIMIT || 100,
    message: 'Слишком много запросов с этого IP'
});

const registrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: 'Слишком много попыток регистрации'
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Слишком много попыток входа'
});

const emailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5
});

app.use('/api/email', emailLimiter);
app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', registrationLimiter);

app.use(cookieParser({
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
}));

app.use(express.json({limit: '10kb'}));
app.use(express.urlencoded({extended: true, limit: '10kb'}));
app.use(mongoSanitize());
app.use(xss());

app.use(
    csurf({
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
            maxAge: 200
        },
        ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
    })
);

app.use(httpLogger);

app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({error: 'Недействительный CSRF токен'});
    }
    next(err);
});

app.use('/api', router);


app.use((req, res, next) => {
    logger.warn('Запрошен несуществующий маршрут', {
        path: req.originalUrl,
        method: req.method,
        ip: req.ip,
    });
    const ApiError = require('./src/utils/errors/ApiError');
    next(new ApiError(404, 'Маршрут не найден'));
});

app.use(errorHandler);

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});
server.setTimeout(30000);

const compression = require('compression');
if (process.env.NODE_ENV === 'production') {
    app.use(compression());
}

const startServer = (port) => {
    try {
        server.listen(port, () => {
            logger.info('Сервер успешно запущен', {
                port,
                environment: process.env.NODE_ENV,
                corsOrigin: corsOptions.origin,
            });
        });
    } catch (error) {
        if (error.code === 'EADDRINUSE') {
            logger.warn(`Порт ${port} занят, пробуем следующий порт`, {
                currentPort: port,
                nextPort: port + 1,
            });
            startServer(port + 1);
        } else {
            logger.error('Ошибка при запуске сервера', {
                error: error.message,
                stack: error.stack,
            });
            process.exit(1);
        }
    }
};

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        logger.warn('Порт уже используется', {
            port: PORT,
            action: 'пробуем следующий порт',
        });
        server.close();
        startServer(parseInt(PORT) + 1);
    } else {
        logger.error('Ошибка сервера', {
            error: error.message,
            stack: error.stack,
            code: error.code,
        });
        process.exit(1);
    }
});

process.on('uncaughtException', (error) => {
    logger.error('Необработанное исключение:', {
        error: error.message,
        stack: error.stack,
        type: 'UncaughtException',
    });
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    logger.error('Необработанное отклонение промиса:', {
        error: error.message,
        stack: error.stack,
        type: 'UnhandledRejection',
    });
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
['SIGTERM', 'SIGINT'].forEach((signal) => {
    process.on(signal, () => {
        logger.info('Получен сигнал завершения работы', {signal});
        server.close(() => {
            logger.info('Сервер успешно остановлен', {signal});
            process.exit(0);
        });
    });
});

startServer(PORT);