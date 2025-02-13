const getRedisClient = require('../config/redis');
const { logError } = require('../utils/logger');

const cacheMiddleware = (options = {}) => {
    return async (req, res, next) => {
        try {
            const redis = await getRedisClient();
            if (!redis) return next();

            const cacheKey = typeof options.key === 'function'
                ? options.key(req)
                : options.key || `${req.method}:${req.originalUrl}`;

            const cachedData = await redis.get(cacheKey);

            if (cachedData) {
                return res.json(JSON.parse(cachedData));
            }

            const originalJson = res.json;
            res.json = function(data) {
                redis.set(
                    cacheKey,
                    JSON.stringify(data),
                    'EX',
                    options.expire || 3600
                ).catch(error => logError('Redis cache set error:', error));
                return originalJson.call(this, data);
            };

            next();
        } catch (error) {
            logError('Cache middleware error:', error);
            next();
        }
    };
};

const clearCache = (pattern) => {
    return async (req, res, next) => {
        try {
            const redis = await getRedisClient();
            if (!redis) return next();

            const cacheKey = typeof pattern === 'function'
                ? pattern(req)
                : pattern;

            if (cacheKey.includes('*')) {
                const keys = await redis.keys(cacheKey);
                if (keys.length > 0) {
                    await redis.del(...keys);
                }
            } else {
                await redis.del(cacheKey);
            }

            next();
        } catch (error) {
            logError('Clear cache error:', { error, pattern: typeof pattern === 'function' ? pattern(req) : pattern });
            next();
        }
    };
};

module.exports = {
    cacheMiddleware,
    clearCache
};