const { body, param } = require('express-validator');

const categoryValidators = {
    createCategoryValidation: [
        body('name')
            .trim()
            .notEmpty()
            .withMessage('Название категории обязательно')
            .isLength({ min: 2 })
            .withMessage('Название категории должно содержать минимум 2 символа'),

        body('slug')
            .trim()
            .notEmpty()
            .withMessage('Slug категории обязателен')
            .isLength({ min: 2 })
            .withMessage('Slug категории должен содержать минимум 2 символа'),

        body('description')
            .optional()
            .trim()
            .isString()
            .withMessage('Описание категории должно быть строкой')
            .isLength({ max: 500 })
            .withMessage('Описание категории не должно превышать 500 символов')
    ],

    updateCategoryValidation: [
        param('id')
            .isInt({ gt: 0 })
            .withMessage('ID категории должен быть положительным целым числом'),

        body('name')
            .optional()
            .trim()
            .notEmpty()
            .withMessage('Название категории не может быть пустым')
            .isLength({ min: 2 })
            .withMessage('Название категории должно содержать минимум 2 символа'),

        body('slug')
            .optional()
            .trim()
            .notEmpty()
            .withMessage('Slug категории не может быть пустым')
            .isLength({ min: 2 })
            .withMessage('Slug категории должен содержать минимум 2 символа'),

        body('description')
            .optional()
            .trim()
            .isString()
            .withMessage('Описание категории должно быть строкой')
            .isLength({ max: 500 })
            .withMessage('Описание категории не должно превышать 500 символов')
    ],

    getCategoryByIdValidation: [
        param('id')
            .isInt({ gt: 0 })
            .withMessage('ID категории должен быть положительным целым числом')
    ],

    deleteCategoryValidation: [
        param('id')
            .isInt({ gt: 0 })
            .withMessage('ID категории должен быть положительным целым числом')
    ]
};

module.exports = categoryValidators;
