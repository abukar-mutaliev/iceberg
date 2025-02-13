const { body, param } = require('express-validator');

const createAdminValidation = [
    body('email')
        .isEmail()
        .withMessage('Введите корректный email')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Пароль должен содержать минимум 6 символов')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Пароль должен содержать заглавные, строчные буквы и цифры'),
    body('name')
        .notEmpty()
        .withMessage('Имя обязательно')
        .isLength({ min: 2 })
        .withMessage('Имя должно содержать минимум 2 символа'),
    body('phone')
        .optional()
        .matches(/^\+?[1-9]\d{10,14}$/)
        .withMessage('Введите корректный номер телефона'),
    body('address')
        .optional()
        .isLength({ min: 5 })
        .withMessage('Адрес должен содержать минимум 5 символов')
];

const changeRoleValidation = [
    param('userId')
        .isInt({ min: 1 })
        .withMessage('ID пользователя должен быть положительным целым числом'),

    body('newRole')
        .isIn(['EMPLOYEE', 'SUPPLIER', 'ADMIN', 'CLIENT', 'DRIVER'])
        .withMessage('Недопустимая роль'),

    body('name')
        .if(body('newRole').equals('ADMIN'))
        .optional()
        .isLength({ min: 2 })
        .withMessage('Имя должно содержать минимум 2 символа'),

    body('position')
        .if(body('newRole').equals('EMPLOYEE'))
        .notEmpty()
        .withMessage('Должность обязательна')
        .isLength({ min: 2 })
        .withMessage('Должность должна содержать минимум 2 символа'),

    body('companyName')
        .if(body('newRole').equals('SUPPLIER'))
        .notEmpty()
        .withMessage('Название компании обязательно')
        .isLength({ min: 2 })
        .withMessage('Название компании должно содержать минимум 2 символа'),

    body('contactPerson')
        .if(body('newRole').equals('SUPPLIER'))
        .notEmpty()
        .withMessage('Контактное лицо обязательно')
        .isLength({ min: 2 })
        .withMessage('Контактное лицо должно содержать минимум 2 символа'),

    body('phone')
        .optional()
        .matches(/^\+?[1-9]\d{10,14}$/)
        .withMessage('Введите корректный номер телефона'),

    body('address')
        .optional()
        .isLength({ min: 5 })
        .withMessage('Адрес должен содержать минимум 5 символов')
];

const createStaffValidation = [
    body('email')
        .isEmail()
        .withMessage('Введите корректный email')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Пароль должен содержать минимум 6 символов')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Пароль должен содержать заглавные, строчные буквы и цифры'),
    body('role')
        .isIn(['EMPLOYEE', 'SUPPLIER'])
        .withMessage('Недопустимая роль'),
    body('name')
        .if((value, { req }) => req.body.role === 'EMPLOYEE')
        .notEmpty()
        .withMessage('Имя обязательно')
        .isLength({ min: 2 })
        .withMessage('Имя должно содержать минимум 2 символа'),
    body('position')
        .if((value, { req }) => req.body.role === 'EMPLOYEE')
        .notEmpty()
        .withMessage('Должность обязательна')
        .isLength({ min: 2 })
        .withMessage('Должность должна содержать минимум 2 символа'),
    body('companyName')
        .if((value, { req }) => req.body.role === 'SUPPLIER')
        .notEmpty()
        .withMessage('Название компании обязательно')
        .isLength({ min: 2 })
        .withMessage('Название компании должно содержать минимум 2 символа'),
    body('contactPerson')
        .if((value, { req }) => req.body.role === 'SUPPLIER')
        .notEmpty()
        .withMessage('Контактное лицо обязательно')
        .isLength({ min: 2 })
        .withMessage('Контактное лицо должно содержать минимум 2 символа'),
    body('phone')
        .optional()
        .matches(/^\+?[1-9]\d{10,14}$/)
        .withMessage('Введите корректный номер телефона'),
    body('address')
        .optional()
        .isLength({ min: 5 })
        .withMessage('Адрес должен содержать минимум 5 символов')
];

module.exports = {
    createAdminValidation,
    createStaffValidation,
    changeRoleValidation
};
