const { body } = require('express-validator');

const driverValidators = {
    updateProfileValidation: [
        body('name')
            .optional()
            .trim()
            .isLength({ min: 2 })
            .withMessage('Имя должно содержать минимум 2 символа'),

        body('phone')
            .optional()
            .trim()
            .matches(/^\+?[1-9]\d{10,14}$/)
            .withMessage('Введите корректный номер телефона'),

        body('districts')
            .optional()
            .isArray()
            .withMessage('Районы должны быть массивом')
            .custom((value) => {
                if (!value || !Array.isArray(value)) return true;
                return value.every(id => Number.isInteger(id) && id > 0);
            })
            .withMessage('ID районов должны быть положительными целыми числами'),

        body('address')
            .optional()
            .trim()
            .isLength({ min: 5 })
            .withMessage('Адрес должен содержать минимум 5 символов')
    ],

    uploadAvatarValidation: [
        body()
            .custom((_, { req }) => {
                if (!req.file) {
                    throw new Error('Файл не загружен');
                }

                const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;
                if (req.file.size > maxSize) {
                    throw new Error(`Размер файла не должен превышать ${maxSize / 1024 / 1024}MB`);
                }

                const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
                if (!allowedMimeTypes.includes(req.file.mimetype)) {
                    throw new Error('Допустимы только изображения в форматах JPEG, PNG или WEBP');
                }

                return true;
            })
    ]
};

module.exports = { driverValidators };