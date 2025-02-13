const { validationResult } = require('express-validator');
const prisma = require('../../models');
const { cacheMiddleware, clearCache } = require('../../middlewares/cache.middleware');
const CacheService = require('../../services/cache.service');
const { logError, logInfo } = require('../../utils/logger');

const feedbackController = {
    createFeedback: [
        clearCache((req) => `feedback:client:${req.user.client.id}:*`),
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({errors: errors.array()});
            }

            try {
                const clientId = req.user.client.id;
                const {orderId, rating, comment} = req.body;

                const order = await prisma.order.findFirst({
                    where: {
                        id: Number(orderId),
                        clientId,
                        status: 'DELIVERED'
                    }
                });

                if (!order) {
                    return res.status(404).json({
                        message: 'Заказ не найден или еще не доставлен'
                    });
                }

                const existingFeedback = await prisma.feedback.findUnique({
                    where: {orderId: Number(orderId)}
                });

                if (existingFeedback) {
                    return res.status(400).json({
                        message: 'Отзыв для этого заказа уже существует'
                    });
                }

                const feedback = await prisma.feedback.create({
                    data: {
                        clientId,
                        orderId: Number(orderId),
                        rating,
                        comment
                    }
                });

                await CacheService.clearPattern(`feedback:client:${clientId}:*`);
                await CacheService.clearPattern('feedback:all:*');

                logInfo('Отзыв успешно создан', {
                    clientId,
                    orderId,
                    feedbackId: feedback.id
                });

                res.status(201).json(feedback);
            } catch (error) {
                logError('Create feedback error:', error);
                res.status(500).json({message: 'Ошибка при создании отзыва'});
            }
        }
    ],

    getMyFeedback: [
        cacheMiddleware({
            expire: 300,
            key: (req) => `feedback:client:${req.user.client.id}:page${req.query.page || 1}:limit${req.query.limit || 10}`
        }),
        async (req, res) => {
            try {
                const clientId = req.user.client.id;
                const {page = 1, limit = 10} = req.query;

                const feedback = await prisma.feedback.findMany({
                    where: {clientId},
                    skip: (page - 1) * Number(limit),
                    take: Number(limit),
                    include: {
                        order: {
                            include: {
                                orderItems: {
                                    include: {product: true}
                                }
                            }
                        }
                    },
                    orderBy: {createdAt: 'desc'}
                });

                const total = await prisma.feedback.count({
                    where: {clientId}
                });

                const response = {
                    feedback,
                    total,
                    pages: Math.ceil(total / limit)
                };

                logInfo('Получены отзывы клиента', {
                    clientId,
                    page,
                    limit,
                    total: feedback.length
                });

                res.json(response);
            } catch (error) {
                logError('Get feedback error:', error);
                res.status(500).json({message: 'Ошибка при получении отзывов'});
            }
        }
    ],

    getAllFeedback: [
        cacheMiddleware({
            expire: 300,
            key: (req) => `feedback:all:page${req.query.page || 1}:limit${req.query.limit || 10}`
        }),
        async (req, res) => {
            try {
                const {page = 1, limit = 10} = req.query;

                const feedback = await prisma.feedback.findMany({
                    skip: (page - 1) * Number(limit),
                    take: Number(limit),
                    include: {
                        client: true,
                        order: {
                            include: {
                                orderItems: {
                                    include: {product: true}
                                }
                            }
                        }
                    },
                    orderBy: {createdAt: 'desc'}
                });

                const total = await prisma.feedback.count();

                const response = {
                    feedback,
                    total,
                    pages: Math.ceil(total / limit)
                };

                res.json(response);
            } catch (error) {
                logError('Get all feedback error:', error);
                res.status(500).json({message: 'Ошибка при получении всех отзывов'});
            }
        }
    ]
}

module.exports = feedbackController;
