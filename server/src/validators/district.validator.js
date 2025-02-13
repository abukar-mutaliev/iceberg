const { body } = require('express-validator');

const districtValidators = {
    createValidation: [
        body('name')
            .trim()
            .notEmpty()
            .withMessage('Название района обязательно')
            .isLength({ min: 2, max: 100 })
            .withMessage('Название района должно содержать от 2 до 100 символов'),

        body('description')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Описание района не должно превышать 500 символов')
    ],

    updateValidation: [
        body('name')
            .optional()
            .trim()
            .notEmpty()
            .withMessage('Название района не может быть пустым')
            .isLength({ min: 2, max: 100 })
            .withMessage('Название района должно содержать от 2 до 100 символов'),

        body('description')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Описание района не должно превышать 500 символов')
    ]
};

module.exports = { districtValidators };