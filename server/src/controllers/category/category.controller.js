const prisma = require('../../models');
const asyncHandler = require('../../utils/asyncHandler');
const { validationResult } = require('express-validator');
const ApiError = require('../../utils/errors/ApiError');
const { logInfo, logError } = require("../../utils/logger");

const categoryController = {
    createCategory: [
        asyncHandler(async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw ApiError.badRequest('Ошибка валидации', errors.array());
            }

            const { name, description } = req.body;
            const slug = name.toLowerCase().replace(/\s+/g, '-');

            const category = await prisma.category.create({
                data: { name, slug, description }
            });

            logInfo('Категория успешно создана', { categoryId: category.id });

            res.status(201).json({
                status: 'success',
                data: { category }
            });
        })
    ],

    getCategories: [
        asyncHandler(async (req, res) => {
            const categories = await prisma.category.findMany();
            res.json({
                status: 'success',
                data: { categories }
            });
        })
    ],

    getCategoryById: [
        asyncHandler(async (req, res) => {
            const { id } = req.params;

            const category = await prisma.category.findUnique({
                where: { id: parseInt(id) }
            });

            if (!category) {
                throw ApiError.notFound('Категория не найдена');
            }

            res.json({
                status: 'success',
                data: { category }
            });
        })
    ],

    updateCategory: [
        asyncHandler(async (req, res) => {
            const { id } = req.params;
            const { name, description } = req.body;

            const category = await prisma.category.update({
                where: { id: parseInt(id) },
                data: {
                    name,
                    slug: name.toLowerCase().replace(/\s+/g, '-'),
                    description
                }
            });

            res.json({
                status: 'success',
                data: { category }
            });
        })
    ],

    deleteCategory: [
        asyncHandler(async (req, res) => {
            const { id } = req.params;

            await prisma.category.delete({
                where: { id: parseInt(id) }
            });

            res.json({
                status: 'success',
                message: 'Категория успешно удалена'
            });
        })
    ]
};

module.exports = categoryController;
