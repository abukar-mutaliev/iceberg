const getRedisClient = require('../config/redis');
const { logError } = require('../utils/logger');

class CacheService {
    static async get(key) {
        try {
            const redis = await getRedisClient();
            if (!redis) return null;

            const data = await redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logError('Cache get error:', error);
            return null;
        }
    }

    static async set(key, data, expire) {
        try {
            const redis = await getRedisClient();
            if (!redis) return;

            if (expire) {
                await redis.set(key, JSON.stringify(data), 'EX', expire);
            } else {
                await redis.set(key, JSON.stringify(data));
            }
        } catch (error) {
            logError('Cache set error:', error);
        }
    }

    static async clearPattern(pattern) {
        try {
            const redis = await getRedisClient();
            if (!redis) return;

            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } catch (error) {
            logError('Cache clear error:', error);
        }
    }
}

module.exports = CacheService;