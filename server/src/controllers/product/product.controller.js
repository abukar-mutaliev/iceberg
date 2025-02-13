const prisma = require('../../models');
const { validationResult } = require('express-validator');
const ApiError = require('../../utils/errors/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const { logWarning, logInfo, logError } = require("../../utils/logger");
const { cacheMiddleware, clearCache } = require('../../middlewares/cache.middleware');
const CacheService = require('../../services/cache.service');
const path = require('path');
const fs = require('fs/promises');
const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const PRODUCTS_DIR = 'products';


const parseCategoryIds = (categories) => {
    try {
        if (!categories) return [];

        if (typeof categories === 'string') {
            if (categories.includes(',')) {
                return categories.split(',')
                    .map(id => id.trim())
                    .filter(id => id)
                    .map(id => parseInt(id));
            }

            try {
                const parsed = JSON.parse(categories);
                return Array.isArray(parsed) ? parsed.map(id => parseInt(id)) : [parseInt(categories)];
            } catch (e) {
                const id = parseInt(categories);
                return isNaN(id) ? [] : [id];
            }
        }

        if (Array.isArray(categories)) {
            return categories.map(id => parseInt(id)).filter(id => !isNaN(id));
        }

        return [];
    } catch (error) {
        console.error('Error parsing categories:', error);
        return [];
    }
};

const productController = {
    async saveImages(files) {
        const uploadPath = path.join(UPLOAD_DIR, PRODUCTS_DIR);
        await fs.mkdir(uploadPath, {recursive: true});

        return Promise.all(files.map(async (file) => {
            const sanitizedName = file.originalname
                .replace(/[^a-zA-Z0-9.-]/g, '')
                .toLowerCase();

            const uniqueName = `${Date.now()}-${sanitizedName}`;
            const filePath = path.posix.join(PRODUCTS_DIR, uniqueName);

            await fs.writeFile(path.join(UPLOAD_DIR, PRODUCTS_DIR, uniqueName), file.buffer);

            return filePath;
        }));
    },

    async deleteImages(images) {
        return Promise.all(images.map(async (image) => {
            try {
                await fs.unlink(path.join(UPLOAD_DIR, image));
            } catch (error) {
                logError('Ошибка при удалении изображения', {image, error});
            }
        }));
    },

    createProduct: [
        clearCache('products:*'),
        asyncHandler(async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                logWarning('Ошибка валидации при создании продукта', {
                    data: req.body,
                    errors: errors.array()
                });
                throw ApiError.badRequest('Ошибка валидации', errors.array());
            }

            logInfo('Данные пользователя:', {
                role: req.user.role,
                userId: req.user.id
            });

            let supplierId;
            let savedImagePaths = [];

            try {
                if (req.user.role === 'SUPPLIER') {
                    const supplier = await prisma.supplier.findUnique({
                        where: { userId: req.user.id }
                    });
                    if (!supplier) {
                        throw ApiError.badRequest('Поставщик не найден для данного пользователя');
                    }
                    supplierId = supplier.id;
                }
                else if (req.user.role === 'ADMIN' || req.user.role === 'EMPLOYEE') {
                    if (!req.body.supplierId) {
                        throw ApiError.badRequest('Необходимо выбрать поставщика');
                    }

                    const supplier = await prisma.supplier.findUnique({
                        where: { id: parseInt(req.body.supplierId, 10) }
                    });

                    if (!supplier) {
                        throw ApiError.badRequest('Указанный поставщик не найден');
                    }
                    supplierId = supplier.id;
                }

                const { name, description, price, stockQuantity, categories } = req.body;

                if (req.files?.length) {
                    savedImagePaths = await productController.saveImages(req.files);
                }

                const categoryIds = parseCategoryIds(categories);
                if (categoryIds.length > 0) {
                    const existingCategories = await prisma.category.findMany({
                        where: {
                            id: { in: categoryIds }
                        }
                    });

                    if (existingCategories.length !== categoryIds.length) {
                        if (savedImagePaths.length) {
                            await productController.deleteImages(savedImagePaths);
                        }
                        throw ApiError.badRequest('Некоторые категории не существуют');
                    }
                }

                const data = {
                    supplierId,
                    name,
                    description,
                    price: parseFloat(price),
                    stockQuantity: parseInt(stockQuantity, 10),
                    images: savedImagePaths,
                    categories: categoryIds.length
                        ? { connect: categoryIds.map((id) => ({ id })) }
                        : undefined,
                    isActive: true
                };

                const product = await prisma.product.create({
                    data,
                    include: {
                        categories: true,
                        supplier: true
                    }
                });

                logInfo('Продукт успешно создан', {
                    productId: product.id,
                    categoryIds,
                    images: savedImagePaths
                });

                res.status(201).json({
                    status: 'success',
                    data: {
                        product: {
                            ...product,
                            images: product.images.map((img) => `${baseUrl}/uploads/${img}`)
                        }
                    },
                    message: 'Продукт успешно создан'
                });
            } catch (error) {
                if (savedImagePaths.length) {
                    await productController.deleteImages(savedImagePaths);
                }
                logError('Ошибка при создании продукта:', {
                    error: error.message,
                    stack: error.stack,
                    user: req.user,
                    body: req.body
                });
                throw error;
            }
        })
    ],

    getProducts: [
        cacheMiddleware({
            expire: 300,
            key: 'products:all'
        }),
        asyncHandler(async (req, res) => {
            try {
                logInfo('Начало запроса получения всех продуктов');

                const products = await prisma.product.findMany({
                    include: {
                        supplier: {
                            select: {
                                id: true,
                                companyName: true,
                                contactPerson: true
                            }
                        },
                        categories: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
                        feedbacks: {
                            include: {
                                client: {
                                    include: {
                                        user: {
                                            select: {
                                                email: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                });

                logInfo(`Получено ${products.length} продуктов`);

                const formattedProducts = products.map(product => {
                    logInfo('Структура продукта', {
                        productId: product.id,
                        hasFeedbacks: product.feedbacks?.length > 0,
                        feedbacksCount: product.feedbacks?.length
                    });

                    return {
                        ...product,
                        categories: product.categories,
                        images: product.images ? product.images.map(img => `${baseUrl}/uploads/${img}`) : [],
                        feedbacks: product.feedbacks.map(feedback => {
                            return {
                                id: feedback.id,
                                rating: feedback.rating,
                                comment: feedback.comment,
                                client: feedback.client ? {
                                    id: feedback.client.id,
                                    name: feedback.client.name,
                                    email: feedback.client.user?.email
                                } : null,
                                createdAt: feedback.createdAt
                            };
                        })
                    };
                });

                res.json({
                    status: 'success',
                    data: formattedProducts
                });

            } catch (error) {
                logError('Ошибка при получении продуктов', {
                    error: {
                        message: error.message,
                        name: error.name,
                        stack: error.stack
                    }
                });
                throw error;
            }
        })
    ],

    getProductById: [
        cacheMiddleware({
            expire: 300,
            key: (req) => `products:${req.params.id}`,
        }),
        asyncHandler(async (req, res) => {
            const {id} = req.params;

            try {
                const product = await prisma.product.findUnique({
                    where: {
                        id: parseInt(id, 10)
                    },
                    include: {
                        supplier: true,
                        categories: true,
                        feedbacks: {
                            include: {
                                client: {
                                    select: {
                                        id: true,
                                        name: true,
                                        phone: true,
                                        user: {
                                            select: {
                                                email: true
                                            }
                                        }
                                    }
                                }
                            },
                            orderBy: {
                                createdAt: 'desc'
                            }
                        }
                    }
                });

                if (!product) {
                    logWarning('Продукт не найден', {productId: id});
                    throw ApiError.notFound('Продукт не найден');
                }

                const formattedFeedbacks = product.feedbacks.map(feedback => ({
                    id: feedback.id,
                    rating: feedback.rating,
                    comment: feedback.comment,
                    client: feedback.client && {
                        id: feedback.client.id,
                        name: feedback.client.name,
                        phone: feedback.client.phone,
                        email: feedback.client.user?.email
                    },
                    createdAt: feedback.createdAt
                }));

                const response = {
                    ...product,
                    categories: product.categories,
                    images: product.images ? product.images.map(img => `${baseUrl}/uploads/${img}`) : [],
                    feedbacks: formattedFeedbacks
                };

                res.json({
                    status: 'success',
                    data: response
                });

            } catch (error) {
                logError('Ошибка при получении продукта', {
                    productId: id,
                    error: error.message,
                    stack: error.stack,
                    name: error.name
                });

                if (error instanceof Prisma.PrismaClientKnownRequestError) {
                    throw ApiError.badRequest(error.message);
                }
                throw ApiError.internal(`Ошибка при получении продукта: ${error.message}`);
            }
        })
    ],

    updateProduct: [
        clearCache('products:*'),
        asyncHandler(async (req, res) => {
            const { id } = req.params;
            const {
                supplierId,
                name,
                description,
                price,
                stockQuantity,
                categories,
                removeImages
            } = req.body;

            try {
                const existingProduct = await prisma.product.findUnique({
                    where: { id: parseInt(id) },
                    include: {
                        categories: true,
                        supplier: true
                    }
                });

                if (!existingProduct) {
                    throw ApiError.notFound('Продукт не найден');
                }

                if (req.user.role === 'SUPPLIER') {
                    const supplier = await prisma.supplier.findUnique({
                        where: { userId: req.user.id }
                    });
                    if (!supplier || supplier.id !== existingProduct.supplierId) {
                        throw ApiError.forbidden('У вас нет прав на редактирование этого продукта');
                    }
                }

                let imagePaths = [...existingProduct.images || []];

                if (removeImages) {
                    try {
                        const imagesToRemove = JSON.parse(removeImages);
                        if (Array.isArray(imagesToRemove)) {
                            await productController.deleteImages(imagesToRemove);
                            imagePaths = imagePaths.filter(img => !imagesToRemove.includes(img));
                        }
                    } catch (e) {
                        throw ApiError.badRequest('Неверный формат списка изображений для удаления');
                    }
                }

                if (req.files?.length) {
                    const newImagePaths = await productController.saveImages(req.files);
                    imagePaths = [...imagePaths, ...newImagePaths];
                }

                const updateData = {};

                if (name !== undefined) updateData.name = name.trim();
                if (description !== undefined) updateData.description = description.trim();
                if (price !== undefined) updateData.price = parseFloat(price);
                if (stockQuantity !== undefined) updateData.stockQuantity = parseInt(stockQuantity);
                if (imagePaths.length > 0) updateData.images = imagePaths;

                if (supplierId !== undefined) {
                    if (req.user.role === 'SUPPLIER') {
                        throw ApiError.badRequest('Поставщик не может изменить привязку к поставщику');
                    }
                    const supplier = await prisma.supplier.findUnique({
                        where: { id: parseInt(supplierId) }
                    });
                    if (!supplier) {
                        throw ApiError.badRequest('Указанный поставщик не найден');
                    }
                    updateData.supplierId = supplier.id;
                }

                if (categories !== undefined) {
                    const categoryIds = parseCategoryIds(categories);
                    if (categoryIds.length > 0) {
                        const existingCategories = await prisma.category.findMany({
                            where: { id: { in: categoryIds } }
                        });

                        if (existingCategories.length !== categoryIds.length) {
                            throw ApiError.badRequest('Некоторые категории не существуют');
                        }

                        updateData.categories = {
                            set: categoryIds.map(id => ({ id }))
                        };
                    } else {
                        updateData.categories = { set: [] };
                    }
                }

                const updatedProduct = await prisma.product.update({
                    where: { id: parseInt(id) },
                    data: updateData,
                    include: {
                        categories: true,
                        supplier: {
                            select: {
                                id: true,
                                companyName: true
                            }
                        }
                    }
                });

                const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
                const productWithUrls = {
                    ...updatedProduct,
                    images: updatedProduct.images?.map(img => `${baseUrl}/uploads/${img}`) || []
                };

                res.json({
                    status: 'success',
                    data: { product: productWithUrls },
                    message: 'Продукт успешно обновлен'
                });

            } catch (error) {
                logError('Ошибка при обновлении продукта:', {
                    productId: id,
                    error: error.message,
                    stack: error.stack,
                    user: req.user,
                    body: req.body
                });

                if (error instanceof ApiError) {
                    throw error;
                }

                if (error.code === 'P2002') {
                    throw ApiError.badRequest('Продукт с таким названием уже существует');
                }
                throw ApiError.internal('Ошибка при обновлении продукта');
            }
        })
    ],

    deleteProduct: [
        asyncHandler(async (req, res, next) => {
            const { id } = req.params;
            await CacheService.clearPattern(`products:${id}`);
            await CacheService.clearPattern('products:all');
            next();
        }),
        asyncHandler(async (req, res) => {
            const { id } = req.params;

            const existingProduct = await prisma.product.findUnique({
                where: { id: parseInt(id, 10) },
                include: {
                    supplier: true
                }
            });

            if (!existingProduct) {
                throw ApiError.notFound('Продукт не найден');
            }

            if (req.user.role === 'SUPPLIER') {
                const supplier = await prisma.supplier.findUnique({
                    where: { userId: req.user.id }
                });

                if (!supplier || existingProduct.supplierId !== supplier.id) {
                    throw ApiError.forbidden('Вы можете удалять только свои продукты');
                }
            } else if (!['ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
                throw ApiError.forbidden('У вас нет прав на удаление продуктов');
            }

            if (existingProduct.images?.length) {
                await productController.deleteImages(existingProduct.images);
            }

            await prisma.product.delete({
                where: { id: parseInt(id, 10) }
            });

            logInfo('Продукт успешно удален', {
                productId: id,
                deletedBy: req.user.id,
                userRole: req.user.role
            });

            res.json({
                status: 'success',
                message: 'Продукт успешно удален'
            });
        })
    ],
}

module.exports = productController;
