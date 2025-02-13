const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:8081';

const corsOptions = {
    origin: function(origin, callback) {
        const allowedOrigins = process.env.CORS_ORIGIN.split(',');
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['X-CSRF-Token'],
};

module.exports = { corsOptions, corsOrigin };