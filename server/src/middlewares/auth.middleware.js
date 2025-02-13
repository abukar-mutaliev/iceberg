const jwt = require('jsonwebtoken');
const prisma = require('../models');
const ApiError = require('../utils/errors/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { logInfo, logError, logWarning } = require('../utils/logger');

const authMiddleware = asyncHandler(async (req, res, next) => {

    const authHeader = req.header('Authorization');
    const ip = req.ip;
    const userAgent = req.get('user-agent');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logWarning('Попытка доступа без токена', {
            ip,
            userAgent,
            path: req.path
        });
        throw ApiError.unauthorized('Токен не предоставлен');
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== 'access') {
            logWarning('Использование неверного типа токена', {
                tokenType: decoded.type,
                userId: decoded.userId,
                ip
            });
            throw ApiError.unauthorized('Неверный тип токена');
        }

        const invalidToken = await prisma.invalidToken.findFirst({
            where: {
                token,
                expiresAt: {
                    gt: new Date()
                }
            }
        });

        if (invalidToken) {
            logWarning('Попытка использования недействительного токена', {
                userId: decoded.userId,
                ip,
                tokenId: invalidToken.id
            });
            throw ApiError.unauthorized('Токен недействителен');
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                client: true,
                employee: true,
                supplier: true,
                admin: true,
            }
        });

        if (!user) {
            logError('Токен содержит ID несуществующего пользователя', {
                userId: decoded.userId,
                ip
            });
            throw ApiError.unauthorized('Пользователь не найден');
        }

        logInfo('Успешная аутентификация', {
            userId: user.id,
            role: user.role,
            ip,
            path: req.path
        });
        req.user = user;
        req.token = token;
        next();

    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            logWarning('Использование просроченного токена', {
                ip,
                token: token.substring(0, 10) + '...'
            });
            throw ApiError.unauthorized('Срок действия токена истек');
        }
        if (error instanceof jwt.JsonWebTokenError) {
            logWarning('Использование недействительного токена', {
                ip,
                error: error.message
            });
            throw ApiError.unauthorized('Недействительный токен');
        }
        throw error;
    }
});

const refreshTokenMiddleware = asyncHandler(async (req, res, next) => {
    const { refreshToken } = req.body;
    const ip = req.ip;

    if (!refreshToken) {
        logWarning('Попытка обновления токена без refresh token', { ip });
        throw ApiError.badRequest('Refresh token не предоставлен');
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        if (decoded.type !== 'refresh') {
            logWarning('Неверный тип токена при обновлении', {
                tokenType: decoded.type,
                userId: decoded.userId,
                ip
            });
            throw ApiError.unauthorized('Неверный тип токена');
        }

        const tokenRecord = await prisma.refreshToken.findFirst({
            where: {
                token: refreshToken,
                isValid: true,
                expiresAt: {
                    gt: new Date()
                }
            },
            include: {
                user: {
                    include: {
                        client: true,
                        employee: true,
                        supplier: true,
                        admin: true
                    }
                }
            }
        });

        if (!tokenRecord) {
            logWarning('Использование недействительного refresh token', {
                userId: decoded.userId,
                ip
            });
            throw ApiError.unauthorized('Недействительный refresh token');
        }

        logInfo('Успешная проверка refresh token', {
            userId: tokenRecord.userId,
            ip
        });

        req.tokenRecord = tokenRecord;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            logWarning('Использование просроченного refresh token', { ip });
            throw ApiError.unauthorized('Срок действия refresh token истек');
        }
        throw error;
    }
});

const logoutMiddleware = asyncHandler(async (req, res, next) => {
    const accessToken = req.token;
    const { refreshToken } = req.body;
    const userId = req.user.id;
    const ip = req.ip;

    logInfo('Попытка выхода из системы', {
        userId,
        ip
    });
    logWarning("userId ", userId)
    if (!refreshToken) {
        logWarning('Попытка выхода без refresh token', {
            userId,
            ip
        });
        throw ApiError.badRequest('Refresh token не предоставлен');
    }

    try {
        await prisma.$transaction([
            prisma.refreshToken.updateMany({
                where: {
                    token: refreshToken,
                    userId
                },
                data: {
                    isValid: false
                }
            }),
            prisma.invalidToken.create({
                data: {
                    token: accessToken,
                    userId,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
                }
            })
        ]);

        logInfo('Успешный выход из системы', {
            userId,
            ip
        });

        next();
    } catch (error) {
        logError('Ошибка при выходе из системы', {
            userId,
            ip,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
});

const checkRole = (allowedRoles) => {

    return asyncHandler(async (req, res, next) => {

        const userRole = req.user.role;

        if (!allowedRoles.includes(userRole)) {
            logWarning('Попытка доступа с недостаточными правами', {
                userId: req.user.id,
                userRole: userRole,
                requiredRole: allowedRoles,
                path: req.originalUrl
            });
            throw ApiError.forbidden(`Доступ запрещен. Требуется роль: ${allowedRoles.join(',')}`);
        }
        next();
    });
};

module.exports = {
    auth: authMiddleware,
    checkRole,
    refreshToken: refreshTokenMiddleware,
    logout: logoutMiddleware
};
