const { body, check } = require('express-validator');

const updateAvatarValidator = [
    check('file')
        .custom((value, { req }) => {
            if (!req.file) {
                throw new Error('Файл не загружен');
            }
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!allowedMimeTypes.includes(req.file.mimetype)) {
                throw new Error('Недопустимый формат файла');
            }
            if (req.file.size > 5 * 1024 * 1024) {
                throw new Error('Размер файла не должен превышать 5MB');
            }
            return true;
        })
];
const updateProfileValidators = [
    body('name').optional().isString().trim().withMessage('Имя должно быть строкой'),
    body('phone').optional().matches(/^\+?[0-9]{10,15}$/).withMessage('Некорректный формат телефона'),
    body('address').optional().isString().trim().withMessage('Адрес должен быть строкой'),
    body('position').optional().isString().trim().withMessage('Должность должна быть строкой'),
    body('districts').optional().isArray().withMessage('Районы должны быть массивом идентификаторов'),
    body('districts.*').isInt().withMessage('Каждый идентификатор района должен быть числом'),
    body('companyName').optional().isString().trim().withMessage('Название компании должно быть строкой'),
    body('contactPerson').optional().isString().trim().withMessage('Контактное лицо должно быть строкой'),
    body('inn').optional().matches(/^[0-9]{10,12}$/).withMessage('Некорректный формат ИНН'),
    body('ogrn').optional().matches(/^[0-9]{13,15}$/).withMessage('Некорректный формат ОГРН'),
    body('bankAccount').optional().matches(/^[0-9]{20}$/).withMessage('Некорректный формат расчетного счета'),
    body('bik').optional().matches(/^[0-9]{9}$/).withMessage('Некорректный формат БИК'),
    body('districtId').optional().isInt().withMessage('Идентификатор района должен быть числом'),
];

const changePasswordValidator = [
    body('currentPassword')
        .notEmpty().withMessage('Текущий пароль обязателен')
        .isLength({ min: 6 }).withMessage('Текущий пароль должен содержать минимум 6 символов'),

    body('newPassword')
        .notEmpty().withMessage('Новый пароль обязателен')
        .isLength({ min: 6 }).withMessage('Новый пароль должен содержать минимум 6 символов')
        .matches(/[A-Z]/).withMessage('Новый пароль должен содержать хотя бы одну заглавную букву')
        .matches(/[a-z]/).withMessage('Новый пароль должен содержать хотя бы одну строчную букву')
        .matches(/[0-9]/).withMessage('Новый пароль должен содержать хотя бы одну цифру')
];

module.exports = { updateAvatarValidator, changePasswordValidator, updateProfileValidators };
