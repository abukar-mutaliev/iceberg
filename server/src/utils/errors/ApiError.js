class ApiError extends Error {
    constructor(status, message, errors = []) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.errors = errors;
        this.timestamp = new Date().toISOString();

        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            name: this.name,
            status: this.status,
            message: this.message,
            errors: this.errors,
            timestamp: this.timestamp
        };
    }

    static badRequest(message, errors = []) {
        return new ApiError(400, message, errors);
    }

    static unauthorized(message = 'Не авторизован') {
        return new ApiError(401, message);
    }

    static forbidden(message = 'Нет доступа') {
        return new ApiError(403, message);
    }

    static notFound(message = 'Не найдено') {
        return new ApiError(404, message);
    }

    static internal(message = 'Внутренняя ошибка сервера') {
        return new ApiError(500, message);
    }

    static conflict(message = 'Конфликт данных') {
        return new ApiError(409, message);
    }

    static tooMany(message = 'Слишком много запросов') {
        return new ApiError(429, message);
    }

    static validationError(errors) {
        return new ApiError(400, 'Ошибка валидации', errors);
    }
}

module.exports = ApiError;
