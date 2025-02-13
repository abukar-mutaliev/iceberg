const prisma = require('../../models');
const CacheService = require('../../services/cache.service');
const { cacheMiddleware, clearCache } = require('../../middlewares/cache.middleware');
const { logError, logInfo } = require('../../utils/logger');

const clientOrderController = {
    createOrder: [
        clearCache((req) => `orders:client:${req.user.client.id}:*`),
        async (req, res) => {
            try {
                const clientId = req.user.client.id;
                const {items, comment} = req.body;

                if (!Array.isArray(items) || items.length === 0) {
                    return res.status(400).json({message: 'Список товаров не может быть пустым'});
                }

                for (const item of items) {
                    if (!item.productId || !item.quantity || item.quantity <= 0) {
                        return res.status(400).json({message: 'Неверные данные в элементах заказа'});
                    }
                }

                const order = await prisma.$transaction(async (prisma) => {
                    let totalAmount = 0;
                    const itemsWithProducts = await Promise.all(
                        items.map(async (item) => {
                            const product = await prisma.product.findUnique({
                                where: {id: item.productId}
                            });

                            if (!product) {
                                throw new Error(`Товар с ID ${item.productId} не найден`);
                            }

                            if (product.stockQuantity < item.quantity) {
                                throw new Error(`Недостаточно товара ${product.name}`);
                            }

                            await prisma.product.update({
                                where: {id: item.productId},
                                data: {stockQuantity: product.stockQuantity - item.quantity}
                            });

                            totalAmount += product.price * item.quantity;
                            return {...item, product};
                        })
                    );

                    const newOrder = await prisma.order.create({
                        data: {
                            clientId,
                            totalAmount,
                            status: 'PENDING',
                            comment,
                            orderItems: {
                                create: itemsWithProducts.map(item => ({
                                    productId: item.productId,
                                    quantity: item.quantity,
                                    price: item.product.price
                                }))
                            }
                        },
                        include: {
                            orderItems: {
                                include: {product: true}
                            }
                        }
                    });

                    return newOrder;
                });

                await CacheService.clearPattern(`orders:client:${clientId}:*`);

                res.status(201).json(order);
            } catch (error) {
                logError('Create order error:', error);
                res.status(500).json({message: error.message});
            }
        }
    ],

    getMyOrders: [
        cacheMiddleware({
            expire: 300,
            key: (req) => `orders:client:${req.user.client.id}:${req.query.status || 'all'}:page${req.query.page || 1}:limit${req.query.limit || 10}`
        }),
        async (req, res) => {
            try {
                const clientId = req.user.client.id;
                const { status, page = 1, limit = 10 } = req.query;

                const where = {
                    clientId,
                    ...(status && { status })
                };

                const orders = await prisma.order.findMany({
                    where,
                    skip: (page - 1) * Number(limit),
                    take: Number(limit),
                    include: {
                        orderItems: {
                            include: { product: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                });

                const total = await prisma.order.count({ where });

                const response = {
                    orders,
                    total,
                    pages: Math.ceil(total / limit)
                };

                res.json(response);
            } catch (error) {
                logError('Get orders error:', error);
                res.status(500).json({ message: 'Ошибка при получении заказов' });
            }
        }
    ],

    cancelOrder: [
        clearCache((req) => `orders:client:${req.user.client.id}:*`),
        async (req, res) => {
            try {
                const clientId = req.user.client.id;
                const { orderId } = req.params;
                const { reason } = req.body;

            if (!reason || typeof reason !== 'string' || reason.length < 5) {
                return res.status(400).json({ message: 'Укажите причину отмены заказа (минимум 5 символов)' });
            }

            const order = await prisma.order.findFirst({
                where: {
                    id: Number(orderId),
                    clientId
                }
            });

            if (!order) {
                return res.status(404).json({ message: 'Заказ не найден' });
            }

            if (!['PENDING', 'PROCESSING'].includes(order.status)) {
                return res.status(400).json({
                    message: 'Невозможно отменить заказ в текущем статусе'
                });
            }

            const updatedOrder = await prisma.order.update({
                where: { id: Number(orderId) },
                data: {
                    status: 'CANCELLED',
                    cancelReason: reason,
                    orderItems: {
                        update: order.orderItems.map(item => ({
                            where: { id: item.id },
                            data: {
                                // Предполагается, что есть связь с продуктом
                                // Возвращаем количество на склад
                                // Это требует дополнительной логики
                            }
                        }))
                    }
                },
                include: {
                    orderItems: {
                        include: { product: true }
                    }
                }
            });
                await CacheService.clearPattern(`orders:client:${clientId}:*`);

                res.json(updatedOrder);
            } catch (error) {
                logError('Cancel order error:', error);
                res.status(500).json({ message: 'Ошибка при отмене заказа' });
            }
        }
    ]
};

module.exports = clientOrderController;
