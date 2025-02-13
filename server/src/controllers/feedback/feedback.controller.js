const prisma = require('../../models');
const { validationResult } = require('express-validator');
const ApiError = require('../../utils/errors/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const { logWarning, logInfo, logError } = require("../../utils/logger");
const { cacheMiddleware, clearCache } = require('../../middlewares/cache.middleware');
const CacheService = require('../../services/cache.service');

const feedbackController = {
    createFeedback: [
        clearCache('feedbacks:*'),
        asyncHandler(async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                logWarning('Ошибка валидации при создании отзыва', {
                    data: req.body,
                    errors: errors.array()
                });
                throw ApiError.badRequest('Ошибка валидации', errors.array());
            }

            const { productId, rating, comment } = req.body;
            const userId = req.user.id;

            const client = await prisma.client.findUnique({
                where: { userId: req.user.id },
            });

            if (!client) {
                throw ApiError.badRequest('Только клиент может оставлять отзыв');
            }
            if (rating < 1 || rating > 5) {
                throw ApiError.badRequest('Рейтинг должен быть от 1 до 5');
            }

            const product = await prisma.product.findUnique({
                where: { id: parseInt(productId) },
            });

            if (!product) {
                throw ApiError.notFound('Продукт не найден');
            }

            const feedback = await prisma.feedback.create({
                data: {
                    clientId: client.id,
                    productId: parseInt(productId),
                    rating: parseInt(rating),
                    comment,
                },
            });
            const feedbacks = await prisma.feedback.findMany({
                where: { productId: parseInt(productId) },
                include: {
                    client: {
                        select: { id: true, user: { select: { email: true } } }
                    }
                }
            })

            await CacheService.set(`feedbacks:product:${productId}`, {
                status: 'success',
                data: feedbacks
            }, 300);

            logInfo('Отзыв успешно создан', {
                feedbackId: feedback.id,
                productId: productId,
                userId: userId
            });

            res.status(201).json({
                status: 'success',
                data: feedback,
                message: 'Отзыв успешно создан'
            });
        })
    ],

    updateFeedback: [
        asyncHandler(async (req, res) => {
            const { id } = req.params;
            const { rating, comment } = req.body;

            const existingFeedback = await prisma.feedback.findUnique({
                where: { id: parseInt(id) }
            });

            if (!existingFeedback) {
                throw ApiError.notFound('Отзыв не найден');
            }

            if (rating && (rating < 1 || rating > 5)) {
                throw ApiError.badRequest('Рейтинг должен быть от 1 до 5');
            }

            const updatedFeedback = await prisma.feedback.update({
                where: { id: parseInt(id) },
                data: {
                    rating: rating !== undefined ? parseInt(rating) : undefined,
                    comment: comment || undefined
                }
            });

            await CacheService.clearPattern(`feedbacks:product:${existingFeedback.productId}`);

            logInfo('Отзыв успешно обновлен', { feedbackId: id });

            res.json({
                status: 'success',
                data: updatedFeedback,
                message: 'Отзыв успешно обновлен'
            });
        })
    ],

    deleteFeedback: [
        asyncHandler(async (req, res) => {
            const { id } = req.params;

            const existingFeedback = await prisma.feedback.findUnique({
                where: { id: parseInt(id) },
                include: { product: true }
            });

            if (!existingFeedback) {
                throw ApiError.notFound('Отзыв не найден');
            }

            await prisma.feedback.delete({
                where: { id: parseInt(id) }
            });

            await CacheService.clearPattern(`feedbacks:product:${existingFeedback.productId}`);

            logInfo('Отзыв успешно удалён', { feedbackId: id });

            res.json({
                status: 'success',
                message: 'Отзыв успешно удалён'
            });
        })
    ]
};

module.exports = feedbackController;
