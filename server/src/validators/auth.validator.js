const { body } = require('express-validator');

const authValidators = {
    registerValidation: [
        body('email')
            .trim()
            .isEmail()
            .withMessage('Введите корректный email'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Пароль должен содержать минимум 6 символов'),
        body('name')
            .trim()
            .notEmpty()
            .withMessage('Имя обязательно')
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

    loginValidation: [
        body('email')
            .trim()
            .isEmail()
            .withMessage('Введите корректный email'),

        body('password')
            .notEmpty()
            .withMessage('Введите пароль')
    ]
};

module.exports = authValidators;
