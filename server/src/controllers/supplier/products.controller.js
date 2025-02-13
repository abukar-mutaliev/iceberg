const prisma = require('../../models');

const supplierProductsController = {
    async getMyProducts(req, res) {
        try {
            const supplierId = req.user.supplier.id;
            const { page = 1, limit = 10 } = req.query;

            const products = await prisma.product.findMany({
                where: { supplierId },
                skip: (page - 1) * Number(limit),
                take: Number(limit),
                orderBy: { createdAt: 'desc' }
            });

            const total = await prisma.product.count({
                where: { supplierId }
            });

            res.json({
                products,
                total,
                pages: Math.ceil(total / limit)
            });
        } catch (error) {
            console.error('Get supplier products error:', error);
            res.status(500).json({ message: 'Ошибка при получении продуктов' });
        }
    }
};

module.exports = supplierProductsController;