const ApiError = require('../utils/errors/ApiError');
const { ValidationError } = require('express-validator');
const { Prisma } = require('@prisma/client');
const { logError, logWarning } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    const errorContext = {
        path: req.path,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id,
        userRole: req.user?.role,
        userAgent: req.get('user-agent')
    };

    if (err instanceof ApiError) {
        logWarning('API Error', {
            ...errorContext,
            errorType: 'ApiError',
            status: err.status,
            message: err.message,
            errors: err.errors
        });

        return res.status(err.status).json({
            status: 'error',
            message: err.message,
            errors: err.errors,
            code: err.status
        });
    }

    if (err instanceof Array && err[0] instanceof ValidationError) {
        const validationErrors = err.map(error => ({
            field: error.param,
            message: error.msg
        }));

        logWarning('Validation Error', {
            ...errorContext,
            errorType: 'ValidationError',
            errors: validationErrors
        });

        return res.status(400).json({
            status: 'error',
            message: 'Ошибка валидации',
            errors: validationErrors,
            code: 400
        });
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        const prismaErrorContext = {
            ...errorContext,
            errorType: 'PrismaError',
            prismaCode: err.code,
            target: err.meta?.target
        };

        switch (err.code) {
            case 'P2002':
                logWarning('Database Unique Constraint Violation', prismaErrorContext);
                return res.status(400).json({
                    status: 'error',
                    message: 'Данная запись уже существует',
                    code: 400
                });
            case 'P2025':
                logWarning('Database Record Not Found', prismaErrorContext);
                return res.status(404).json({
                    status: 'error',
                    message: 'Запись не найдена',
                    code: 404
                });
            default:
                logError('Database Error', {
                    ...prismaErrorContext,
                    error: err.message,
                    stack: err.stack
                });
                return res.status(500).json({
                    status: 'error',
                    message: 'Ошибка базы данных',
                    code: 500
                });
        }
    }

    if (err.name === 'JsonWebTokenError') {
        logWarning('Invalid JWT Token', {
            ...errorContext,
            errorType: 'JWTError',
            jwtError: err.message
        });

        return res.status(401).json({
            status: 'error',
            message: 'Недействительный токен',
            code: 401
        });
    }

    if (err.name === 'TokenExpiredError') {
        logWarning('Expired JWT Token', {
            ...errorContext,
            errorType: 'JWTError',
            expiredAt: err.expiredAt
        });

        return res.status(401).json({
            status: 'error',
            message: 'Срок действия токена истек',
            code: 401
        });
    }

    logError('Unhandled Error', {
        ...errorContext,
        errorType: 'UnhandledError',
        error: err.message,
        stack: err.stack,
        name: err.name
    });

    return res.status(500).json({
        status: 'error',
        message: 'Внутренняя ошибка сервера',
        code: 500
    });
};

module.exports = errorHandler;
