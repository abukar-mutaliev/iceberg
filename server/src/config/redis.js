const Redis = require('ioredis');
const { logError } = require('../utils/logger');

let redis = null;

const REDIS_CONFIG = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
    retryStrategy: (times) => {
        if (times > 1) {
            console.log('Redis connection failed, continuing without cache');
            return null;
        }
        return 1000;
    },
    lazyConnect: true
};

async function getRedisClient() {
    if (!redis) {
        try {
            redis = new Redis(REDIS_CONFIG);

            redis.on('error', (error) => {
                logError('Redis connection error:', error);
            });

            redis.on('connect', () => {
                console.log('Redis connected successfully');
            });

            await redis.ping();
        } catch (error) {
            console.log('Redis unavailable, continuing without cache');
            return null;
        }
    }
    return redis;
}

module.exports = getRedisClient;