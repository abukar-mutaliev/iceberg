const prisma = require('../../models');

const recommendationsController = {
    async getPersonalizedOffers(req, res) {
        try {
            const clientId = req.user.client.id;

            const orderHistory = await prisma.order.findMany({
                where: {
                    clientId,
                    status: 'DELIVERED'
                },
                include: {
                    orderItems: {
                        include: { product: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            const categories = orderHistory.flatMap(order =>
                order.orderItems.map(item => item.product.categoryId)
            );

            const uniqueCategories = [...new Set(categories)];

            const recommendations = await prisma.product.findMany({
                where: {
                    categoryId: { in: uniqueCategories },
                    id: {
                        notIn: orderHistory.flatMap(order =>
                            order.orderItems.map(item => item.productId)
                        )
                    }
                },
                take: 10,
                orderBy: {
                    popularity: 'desc'
                }
            });

            res.json(recommendations);
        } catch (error) {
            console.error('Get recommendations error:', error);
            res.status(500).json({ message: 'Ошибка при получении рекомендаций' });
        }
    },

    async getActivePromotions(req, res) {
        try {
            const currentDate = new Date();

            const promotions = await prisma.promotion.findMany({
                where: {
                    startDate: { lte: currentDate },
                    endDate: { gte: currentDate }
                },
                include: {
                    products: true
                },
                orderBy: { priority: 'desc' }
            });

            res.json(promotions);
        } catch (error) {
            console.error('Get promotions error:', error);
            res.status(500).json({ message: 'Ошибка при получении акций' });
        }
    }
};

module.exports = recommendationsController;
