const { body } = require('express-validator');

const twoFactorValidators = {
    verifyValidation: [
        body('token')
            .exists()
            .withMessage('2FA токен отсутствует')
            .notEmpty()
            .withMessage('2FA токен не может быть пустым')
            .isLength({ min: 6, max: 8 })
            .withMessage('2FA токен должен содержать 6-8 цифр')
            .matches(/^[0-9]+$/)
            .withMessage('2FA токен должен содержать только цифры')
            .customSanitizer(value => value.toString().replace(/\s/g, ''))
    ],

    verify2FALoginValidation: [
        body('tempToken')
            .trim()
            .notEmpty()
            .withMessage('Временный токен обязателен'),
        body('twoFactorCode')
            .trim()
            .notEmpty()
            .withMessage('2FA код обязателен')
            .isLength({ min: 6, max: 6 })
            .withMessage('2FA код должен содержать 6 цифр')
            .matches(/^[0-9]+$/)
            .withMessage('2FA код должен содержать только цифры')
    ],

    trustedDeviceValidation: [
        body('deviceId')
            .trim()
            .notEmpty()
            .withMessage('ID устройства обязателен')
            .isLength({ min: 5, max: 100 })
            .withMessage('ID устройства должен быть от 5 до 100 символов')
    ],

    backupCodeValidation: [
        body('code')
            .trim()
            .notEmpty()
            .withMessage('Код обязателен')
            .isLength({ min: 6, max: 8 })
            .withMessage('Код должен быть от 6 до 8 символов')
            .matches(/^[a-f0-9]+$/)
            .withMessage('Код должен содержать только шестнадцатеричные символы')
    ]
};

module.exports = twoFactorValidators;