const prisma = require('../../models');
const ApiError = require('../../utils/errors/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const { logInfo, logError, logWarning } = require('../../utils/logger');
const { validationResult } = require('express-validator');
const CacheService = require('../../services/cache.service');
const { cacheMiddleware, clearCache } = require('../../middlewares/cache.middleware');

const districtController = {
    getAll: [
        cacheMiddleware({
            expire: 300,
            key: () => 'districts:all'
        }),
        asyncHandler(async (req, res) => {
            try {
                logInfo('Запрос на получение списка районов', {
                    userId: req.user.id,
                    role: req.user.role
                });

                const districts = await prisma.district.findMany({
                    include: {
                        _count: {
                            select: {
                                drivers: true,
                                clients: true,
                                stops: true
                            }
                        }
                    },
                    orderBy: {
                        name: 'asc'
                    }
                });

                await CacheService.set(
                    'districts:all',
                    {
                        status: 'success',
                        data: districts
                    },
                    300
                );

                res.json({
                    status: 'success',
                    data: districts
                });
            } catch (error) {
                logError('Ошибка при получении списка районов', {
                    userId: req.user.id,
                    error: error.message,
                    stack: error.stack
                });
                throw error;
            }
        })
    ],

    getOne: [
        cacheMiddleware({
            expire: 300,
            key: (req) => `districts:${req.params.id}`
        }),
        asyncHandler(async (req, res) => {
            const { id } = req.params;

            try {
                logInfo('Запрос на получение района', {
                    userId: req.user.id,
                    districtId: id
                });

                const district = await prisma.district.findUnique({
                    where: { id: parseInt(id) },
                    include: {
                        drivers: {
                            select: {
                                id: true,
                                name: true,
                                phone: true
                            }
                        },
                        stops: {
                            orderBy: {
                                stopTime: 'desc'
                            },
                            take: 10
                        },
                        _count: {
                            select: {
                                clients: true
                            }
                        }
                    }
                });

                if (!district) {
                    throw ApiError.notFound('Район не найден');
                }

                await CacheService.set(
                    `districts:${id}`,
                    {
                        status: 'success',
                        data: district
                    },
                    300
                );

                res.json({
                    status: 'success',
                    data: district
                });
            } catch (error) {
                logError('Ошибка при получении района', {
                    userId: req.user.id,
                    districtId: id,
                    error: error.message,
                    stack: error.stack
                });
                throw error;
            }
        })
    ],

    create: [
        asyncHandler(async (req, res) => {
            const { name, description } = req.body;

            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    throw ApiError.badRequest('Ошибка валидации', errors.array());
                }

                logInfo('Запрос на создание района', {
                    userId: req.user.id,
                    adminId: req.user.admin.id,
                    data: { name, description }
                });

                const existingDistrict = await prisma.district.findFirst({
                    where: { name: name.trim() }
                });

                if (existingDistrict) {
                    throw ApiError.badRequest('Район с таким названием уже существует');
                }

                const district = await prisma.district.create({
                    data: {
                        name: name.trim(),
                        description: description?.trim()
                    }
                });

                await CacheService.clearPattern('districts:*');

                logInfo('Район успешно создан', {
                    userId: req.user.id,
                    adminId: req.user.admin.id,
                    districtId: district.id
                });

                res.status(201).json({
                    status: 'success',
                    data: district,
                    message: 'Район успешно создан'
                });
            } catch (error) {
                logError('Ошибка при создании района', {
                    userId: req.user.id,
                    adminId: req.user.admin.id,
                    error: error.message,
                    stack: error.stack,
                    data: { name, description }
                });
                throw error;
            }
        })
    ],

    update: [
        asyncHandler(async (req, res) => {
            const { id } = req.params;
            const { name, description } = req.body;

            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    throw ApiError.badRequest('Ошибка валидации', errors.array());
                }

                logInfo('Запрос на обновление района', {
                    userId: req.user.id,
                    adminId: req.user.admin.id,
                    districtId: id,
                    updates: { name, description }
                });

                const district = await prisma.district.findUnique({
                    where: { id: parseInt(id) }
                });

                if (!district) {
                    throw ApiError.notFound('Район не найден');
                }

                if (name) {
                    const existingDistrict = await prisma.district.findFirst({
                        where: {
                            name: name.trim(),
                            NOT: { id: parseInt(id) }
                        }
                    });

                    if (existingDistrict) {
                        throw ApiError.badRequest('Район с таким названием уже существует');
                    }
                }

                const updatedDistrict = await prisma.district.update({
                    where: { id: parseInt(id) },
                    data: {
                        name: name?.trim() || undefined,
                        description: description?.trim() || undefined
                    }
                });

                await CacheService.clearPattern('districts:*');

                logInfo('Район успешно обновлен', {
                    userId: req.user.id,
                    adminId: req.user.admin.id,
                    districtId: id
                });

                res.json({
                    status: 'success',
                    data: updatedDistrict,
                    message: 'Район успешно обновлен'
                });
            } catch (error) {
                logError('Ошибка при обновлении района', {
                    userId: req.user.id,
                    adminId: req.user.admin.id,
                    districtId: id,
                    error: error.message,
                    stack: error.stack,
                    updates: { name, description }
                });
                throw error;
            }
        })
    ],

    delete: [
        asyncHandler(async (req, res) => {
            const { id } = req.params;

            try {
                logInfo('Запрос на удаление района', {
                    userId: req.user.id,
                    adminId: req.user.admin.id,
                    districtId: id
                });

                const district = await prisma.district.findUnique({
                    where: { id: parseInt(id) },
                    include: {
                        _count: {
                            select: {
                                drivers: true,
                                clients: true,
                                stops: true
                            }
                        }
                    }
                });

                if (!district) {
                    throw ApiError.notFound('Район не найден');
                }

                if (district._count.drivers > 0 || district._count.clients > 0 || district._count.stops > 0) {
                    throw ApiError.badRequest(
                        'Невозможно удалить район, так как с ним связаны водители, клиенты или остановки'
                    );
                }

                await prisma.district.delete({
                    where: { id: parseInt(id) }
                });

                await CacheService.clearPattern('districts:*');

                logInfo('Район успешно удален', {
                    userId: req.user.id,
                    adminId: req.user.admin.id,
                    districtId: id
                });

                res.json({
                    status: 'success',
                    message: 'Район успешно удален'
                });
            } catch (error) {
                logError('Ошибка при удалении района', {
                    userId: req.user.id,
                    adminId: req.user.admin.id,
                    districtId: id,
                    error: error.message,
                    stack: error.stack
                });
                throw error;
            }
        })
    ]
};

module.exports = districtController;