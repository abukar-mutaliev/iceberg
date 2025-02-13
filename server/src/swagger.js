const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const { logError, logWarning } = require("../src/utils/logger");

let swaggerComponents = {};

const swaggerComponentsPath = path.join(__dirname, 'components', 'schemas', 'swaggerComponents.yaml');

if (fs.existsSync(swaggerComponentsPath)) {
    try {
        const fileContents = fs.readFileSync(swaggerComponentsPath, 'utf8');
        const data = yaml.load(fileContents);
        swaggerComponents = data.components || {};
    } catch (e) {
        logError('Ошибка при загрузке swaggerComponents.yaml:', e);
    }
} else {
    logWarning('Файл swaggerComponents.yaml не найден по пути:', swaggerComponentsPath);
}

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Система управления заказами',
            version: '1.0.0',
            description: 'API документация для системы управления заказами',
            contact: {
                name: 'API Support',
                email: 'support@example.com',
            },
        },
        servers: [
            {
                url: process.env.API_URL || 'http://localhost:5000',
                description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
                csrfAuth: {
                    type: 'apiKey',
                    name: 'X-CSRF-Token',
                    in: 'header',
                    description: 'CSRF token'
                }
            },
            schemas: {
                ...swaggerComponents.schemas,
            },
            responses: {
                UnauthorizedError: {
                    description: 'Access token is missing or invalid',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                        },
                    },
                },
                ...(swaggerComponents.responses || {}),
            },
        },
        security: [
            { bearerAuth: [] },
            { csrfAuth: [] },
        ],
        tags: [
            { name: 'Authentication', description: 'API для аутентификации' },
            { name: 'Profile', description: 'Маршруты для управление профилем' },
            { name: 'Users', description: 'Операции с пользователями' },
            { name: 'Admin', description: 'Маршруты для управления администраторами и персоналом' },
            { name: 'Client', description: 'Маршруты для управления профилем клиента' },
            { name: 'Orders', description: 'Операции с заказами' },
            { name: 'Supplier', description: 'Маршруты для управления профилем поставщика' },
            { name: 'Employee', description: 'Маршруты для управления профилем сотрудником' },
            { name: 'Driver', description: 'Маршруты для управления профилем водителя' },
            { name: 'Stops', description: 'Маршруты для управления остановками водителей' },
            { name: 'Districts', description: 'Маршруты для управление районами' },
            { name: 'StaffApplication', description: 'Маршруты для управления заявками на трудоустройство' },
            { name: 'Categories', description: 'Маршруты для управления категориями' },
            { name: 'Products', description: 'Маршруты для управления продуктами' },
            { name: 'Feedbacks', description: 'Маршруты для управление отзывами' },
        ],
    },
    apis: ['./src/routes/*.js'],
};

module.exports = options;
