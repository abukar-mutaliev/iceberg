const { body } = require('express-validator');

const stopValidators = {
    createValidation: [
        body('districtId')
            .notEmpty()
            .withMessage('ID района обязателен')
            .isInt({ min: 1 })
            .withMessage('ID района должен быть положительным числом'),

        body('address')
            .notEmpty()
            .withMessage('Адрес обязателен')
            .trim()
            .isLength({ min: 5, max: 200 })
            .withMessage('Адрес должен содержать от 5 до 200 символов'),

        body('mapLocation')
            .matches(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/)
            .withMessage('Неверный формат координат'),

        body('stopTime')
            .notEmpty()
            .withMessage('Время остановки обязательно')
            .isISO8601()
            .withMessage('Неверный формат времени')
    ],

    updateValidation: [
        body('address')
            .optional()
            .trim()
            .isLength({ min: 5, max: 200 })
            .withMessage('Адрес должен содержать от 5 до 200 символов'),

        body('mapLocation')
            .optional()
            .matches(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/)
            .withMessage('Неверный формат координат'),

        body('stopTime')
            .optional()
            .isISO8601()
            .withMessage('Неверный формат времени')
    ]
};

module.exports = { stopValidators };