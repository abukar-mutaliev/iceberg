const { body } = require('express-validator');

const employeeValidators = {
    updateProfileValidation: [
        body('name')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Имя должно быть от 2 до 100 символов'),
        body('phone')
            .optional()
            .trim()
            .matches(/^\+?[0-9]{10,15}$/)
            .withMessage('Некорректный формат телефона'),
        body('position')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Должность должна быть от 2 до 100 символов')
    ]
};

module.exports = employeeValidators;

module.exports = { employeeValidators };
