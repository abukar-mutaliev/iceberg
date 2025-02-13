const { body } = require('express-validator');

const clientValidators = {
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

module.exports = { clientValidators };
