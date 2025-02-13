const prisma = require('../models');
const { logInfo, logError } = require('../utils/logger');


const cleanExpiredTokens = async () => {
    const startTime = Date.now();

    try {
        const totalTokens = await prisma.invalidToken.count();

        const expiredTokens = await prisma.invalidToken.findMany({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            },
            select: {
                id: true,
                userId: true,
                expiresAt: true
            }
        });

        const deleted = await prisma.invalidToken.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            }
        });

        const executionTime = Date.now() - startTime;

        logInfo('Очистка просроченных токенов завершена', {
            totalTokensBefore: totalTokens,
            totalTokensAfter: totalTokens - deleted.count,
            deletedCount: deleted.count,
            executionTimeMs: executionTime,
            timestamp: new Date().toISOString()
        });

        if (deleted.count > 0) {
            logInfo('Подробная информация об удаленных токенах', {
                deletedTokens: expiredTokens.map(token => ({
                    id: token.id,
                    userId: token.userId,
                    expiredAt: token.expiresAt
                }))
            });
        }

        return {
            success: true,
            deletedCount: deleted.count,
            executionTime
        };
    } catch (error) {
        logError('Ошибка при очистке просроченных токенов', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        return {
            success: false,
            error: error.message
        };
    }
};

const forceCleanTokens = async (options = {}) => {
    const { olderThan, userId } = options;

    try {
        const whereClause = {
            ...(olderThan && {
                expiresAt: {
                    lt: new Date(olderThan)
                }
            }),
            ...(userId && { userId })
        };

        const deleted = await prisma.invalidToken.deleteMany({
            where: whereClause
        });

        logInfo('Принудительная очистка токенов завершена', {
            deletedCount: deleted.count,
            options,
            timestamp: new Date().toISOString()
        });

        return {
            success: true,
            deletedCount: deleted.count
        };
    } catch (error) {
        logError('Ошибка при принудительной очистке токенов', {
            error: error.message,
            stack: error.stack,
            options,
            timestamp: new Date().toISOString()
        });

        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    cleanExpiredTokens,
    forceCleanTokens
};
