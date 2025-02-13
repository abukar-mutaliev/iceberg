const { body } = require('express-validator');

const supplierValidators = {
    updateProfileValidation: [
        body('companyName')
            .optional()
            .trim()
            .isLength({ min: 2 })
            .withMessage('Название компании должно содержать минимум 2 символа'),

        body('contactPerson')
            .optional()
            .trim()
            .isLength({ min: 2 })
            .withMessage('Имя контактного лица должно содержать минимум 2 символа'),

        body('phone')
            .optional()
            .trim()
            .matches(/^\+?[1-9]\d{10,14}$/)
            .withMessage('Введите корректный номер телефона'),

        body('address')
            .optional()
            .trim()
            .isLength({ min: 5 })
            .withMessage('Адрес должен содержать минимум 5 символов'),

        body('inn')
            .optional()
            .trim()
            .matches(/^\d{10}$|^\d{12}$/)
            .withMessage('Введите корректный ИНН (10 или 12 цифр)'),

        body('ogrn')
            .optional()
            .trim()
            .matches(/^\d{13}$|^\d{15}$/)
            .withMessage('Введите корректный ОГРН (13 или 15 цифр)'),

        body('bankAccount')
            .optional()
            .trim()
            .matches(/^\d{20}$/)
            .withMessage('Введите корректный расчетный счет (20 цифр)'),

        body('bik')
            .optional()
            .trim()
            .matches(/^\d{9}$/)
            .withMessage('Введите корректный БИК (9 цифр)')
    ]
};

module.exports = { supplierValidators };