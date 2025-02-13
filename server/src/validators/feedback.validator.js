const { body, param } = require('express-validator');

const feedbackValidators = {
    createFeedbackValidation: [
        body('productId')
            .notEmpty()
            .withMessage('ID продукта обязателен')
            .isInt({ gt: 0 })
            .withMessage('ID продукта должен быть положительным целым числом'),

        body('rating')
            .notEmpty()
            .withMessage('Рейтинг обязателен')
            .isInt({ min: 1, max: 5 })
            .withMessage('Рейтинг должен быть целым числом от 1 до 5'),

        body('comment')
            .optional()
            .trim()
            .isString()
            .withMessage('Комментарий должен быть строкой')
            .isLength({ max: 500 })
            .withMessage('Комментарий не должен превышать 500 символов')
    ],

    updateFeedbackValidation: [
        param('id')
            .isInt({ gt: 0 })
            .withMessage('ID отзыва должен быть положительным целым числом'),

        body('rating')
            .optional()
            .isInt({ min: 1, max: 5 })
            .withMessage('Рейтинг должен быть целым числом от 1 до 5'),

        body('comment')
            .optional()
            .trim()
            .isString()
            .withMessage('Комментарий должен быть строкой')
            .isLength({ max: 500 })
            .withMessage('Комментарий не должен превышать 500 символов')
    ],

    getFeedbackByIdValidation: [
        param('id')
            .isInt({ gt: 0 })
            .withMessage('ID отзыва должен быть положительным целым числом')
    ],

    deleteFeedbackValidation: [
        param('id')
            .isInt({ gt: 0 })
            .withMessage('ID отзыва должен быть положительным целым числом')
    ]
};

module.exports = feedbackValidators;
