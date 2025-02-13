const {body, param} = require('express-validator');
const prisma = require('../models');

const productValidators = {
    createProductValidation: [
        body('supplierId')
            .custom(async (value, { req }) => {
                if (req.user.role === 'SUPPLIER') {
                    if (value) {
                        throw new Error('Поставщик не может указывать другого поставщика');
                    }
                    return true;
                }

                if (!value) {
                    throw new Error('Необходимо выбрать поставщика');
                }

                const supplier = await prisma.supplier.findUnique({
                    where: { id: parseInt(value) }
                });

                if (!supplier) {
                    throw new Error('Указанный поставщик не найден');
                }

                return true;
            }),

        body('name')
            .notEmpty()
            .withMessage('Название обязательно')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Название должно быть от 2 до 100 символов'),

        body('price')
            .notEmpty()
            .withMessage('Цена обязательна')
            .isFloat({ min: 0 })
            .withMessage('Цена должна быть положительным числом'),

        body('stockQuantity')
            .notEmpty()
            .withMessage('Количество обязательно')
            .isInt({ min: 0 })
            .withMessage('Количество должно быть целым неотрицательным числом'),

        body('description')
            .optional()
            .trim()
            .isLength({ max: 1000 })
            .withMessage('Описание не должно превышать 1000 символов'),

        body('categories')
            .optional()
            .custom((value) => {
                if (!value) return true;

                try {
                    let categories;
                    if (typeof value === 'string' && value.includes(',')) {
                        categories = value.split(',').map(id => parseInt(id.trim()));
                    } else if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
                        categories = JSON.parse(value);
                    } else if (Array.isArray(value)) {
                        categories = value;
                    } else if (value) {
                        categories = [parseInt(value)];
                    } else {
                        categories = [];
                    }

                    if (!categories.every(id => Number.isInteger(id) && id > 0)) {
                        throw new Error('Все ID категорий должны быть положительными целыми числами');
                    }

                    return true;
                } catch (error) {
                    throw new Error('Неверный формат категорий. Используйте массив ID или строку с разделителями-запятыми');
                }
            })
    ],

    updateProductValidation: [
        param('id')
            .isInt({gt: 0})
            .withMessage('ID продукта должен быть положительным целым числом'),

        body('supplierId')
            .optional()
            .isInt({gt: 0})
            .withMessage('supplierId должен быть положительным целым числом'),

        body('name')
            .optional()
            .trim()
            .notEmpty()
            .withMessage('Название продукта не может быть пустым')
            .isLength({min: 2})
            .withMessage('Название должно содержать минимум 2 символа'),

        body('description')
            .optional()
            .trim()
            .isString()
            .withMessage('Описание должно быть строкой'),

        body('price')
            .optional()
            .isFloat({gt: 0})
            .withMessage('Цена должна быть числом больше 0'),

        body('stockQuantity')
            .optional()
            .isInt({min: 0})
            .withMessage('Количество на складе должно быть неотрицательным целым числом'),

        body('categories')
            .optional()
            .custom((value) => {
                try {
                    if (!value) return true;

                    let parsed;
                    if (typeof value === 'string') {
                        if (value.includes(',')) {
                            parsed = value.split(',').map(id => parseInt(id.trim()));
                        } else {
                            parsed = JSON.parse(value);
                        }
                    } else {
                        parsed = value;
                    }

                    if (!Array.isArray(parsed)) {
                        throw new Error('Категории должны быть массивом');
                    }

                    if (!parsed.every(id => Number.isInteger(Number(id)) && Number(id) > 0)) {
                        throw new Error('ID категорий должны быть положительными целыми числами');
                    }

                    return true;
                } catch (error) {
                    throw new Error('Неверный формат категорий');
                }
            }),

        body('removeImages')
            .optional()
            .custom((value) => {
                try {
                    if (!value) return true;
                    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
                    if (!Array.isArray(parsed)) {
                        throw new Error('Список удаляемых изображений должен быть массивом');
                    }
                    return true;
                } catch (error) {
                    throw new Error('Неверный формат списка удаляемых изображений');
                }
            })
    ],
    getProductByIdValidation: [
        param('id')
            .isInt({gt: 0})
            .withMessage('ID продукта должен быть положительным целым числом')
    ],

    deleteProductValidation: [
        param('id')
            .isInt({gt: 0})
            .withMessage('ID продукта должен быть положительным целым числом')
    ]
};

module.exports = productValidators;
