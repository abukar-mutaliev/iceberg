const { validationResult } = require('express-validator');
const ApiError = require('../utils/errors/ApiError');
const { logWarning } = require('../utils/logger');

const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const validationErrors = errors.array().map(err => ({
            field: err.param,
            message: err.msg
        }));

        const logContext = {
            path: req.path,
            method: req.method,
            ip: req.ip,
            userId: req.user?.id,
            userRole: req.user?.role,
            userAgent: req.get('user-agent'),
            body: Object.keys(req.body).reduce((acc, key) => {
                if (['password', 'token', 'refreshToken'].includes(key)) {
                    acc[key] = '[FILTERED]';
                } else {
                    acc[key] = req.body[key];
                }
                return acc;
            }, {}),
            validationErrors
        };

        logWarning('Ошибка валидации входных данных', logContext);

        throw ApiError.badRequest('Ошибка валидации', validationErrors);
    }

    next();
};

module.exports = validate;
