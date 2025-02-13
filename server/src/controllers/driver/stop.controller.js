const prisma = require('../../models');
const ApiError = require('../../utils/errors/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const { logInfo, logError } = require('../../utils/logger');
const { validationResult } = require('express-validator');
const CacheService = require('../../services/cache.service');
const upload = require('../../middlewares/upload.middleware');

const stopController = {
    getDriverStops: [
        asyncHandler(async (req, res) => {
            const driver = await prisma.driver.findUnique({
                where: { userId: req.user.id }
            });

            if (!driver) {
                throw ApiError.notFound('Профиль водителя не найден');
            }

            const driverId = driver.id;

            try {
                logInfo('Запрос на получение остановок водителя', {
                    driverId,
                    userId: req.user.id
                });

                const stops = await prisma.stop.findMany({
                    where: { driverId },
                    include: {
                        district: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    },
                    orderBy: {
                        stopTime: 'desc'
                    }
                });

                const processedStops = stops.map(stop => ({
                    ...stop,
                    photo: stop.photo ? `${process.env.BASE_URL}/uploads/${stop.photo}` : null
                }));

                res.json({
                    status: 'success',
                    data: processedStops
                });
            } catch (error) {
                logError('Ошибка при получении остановок водителя', {
                    driverId,
                    error: error.message,
                    stack: error.stack
                });
                throw error;
            }
        })
    ],

    createStop: [
        asyncHandler(async (req, res) => {
            const driver = await prisma.driver.findUnique({
                where: { userId: req.user.id },
                include: {
                    districts: {
                        select: { id: true }
                    }
                }
            });

            if (!driver) {
                throw ApiError.notFound('Профиль водителя не найден');
            }

            const driverId = driver.id;
            const { districtId, address, mapLocation, stopTime } = req.body;
            let photoPath = null;

            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    throw ApiError.badRequest('Ошибка валидации', errors.array());
                }

                if (!driver.districts.some(d => d.id === parseInt(districtId))) {
                    throw ApiError.badRequest('Вы не можете создать остановку в этом районе');
                }

                if (req.file) {
                    photoPath = await upload.saveFile(req.file, 'stops');
                }

                const stop = await prisma.stop.create({
                    data: {
                        driverId,
                        districtId: parseInt(districtId),
                        address,
                        mapLocation,
                        stopTime: new Date(stopTime),
                        photo: photoPath
                    },
                    include: {
                        district: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                });

                await CacheService.clearPattern(`driver:profile:${req.user.id}`);
                await CacheService.clearPattern(`districts:${districtId}:*`);

                res.status(201).json({
                    status: 'success',
                    data: {
                        ...stop,
                        photo: stop.photo ? `${process.env.BASE_URL}/uploads/${stop.photo}` : null
                    },
                    message: 'Остановка успешно создана'
                });
            } catch (error) {
                if (photoPath) {
                    await upload.deleteFile(photoPath);
                }
                throw error;
            }
        })
    ],

    updateStop: [
        asyncHandler(async (req, res) => {
            const driver = await prisma.driver.findUnique({
                where: { userId: req.user.id }
            });

            if (!driver) {
                throw ApiError.notFound('Профиль водителя не найден');
            }

            const driverId = driver.id;
            const { id } = req.params;
            const { address, mapLocation, stopTime } = req.body;
            let photoPath = null;

            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    throw ApiError.badRequest('Ошибка валидации', errors.array());
                }

                const existingStop = await prisma.stop.findUnique({
                    where: { id: parseInt(id) }
                });

                if (!existingStop) {
                    throw ApiError.notFound('Остановка не найдена');
                }

                if (existingStop.driverId !== driverId) {
                    throw ApiError.forbidden('У вас нет прав на редактирование этой остановки');
                }

                if (req.file) {
                    photoPath = await upload.saveFile(req.file, 'stops');
                    if (existingStop.photo) {
                        await upload.deleteFile(existingStop.photo);
                    }
                }

                const updatedStop = await prisma.stop.update({
                    where: { id: parseInt(id) },
                    data: {
                        address: address || undefined,
                        mapLocation: mapLocation || undefined,
                        stopTime: stopTime ? new Date(stopTime) : undefined,
                        photo: photoPath || undefined
                    },
                    include: {
                        district: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                });

                await CacheService.clearPattern(`driver:profile:${req.user.id}`);
                await CacheService.clearPattern(`districts:${updatedStop.districtId}:*`);

                res.json({
                    status: 'success',
                    data: {
                        ...updatedStop,
                        photo: updatedStop.photo ? `${process.env.BASE_URL}/uploads/${updatedStop.photo}` : null
                    },
                    message: 'Остановка успешно обновлена'
                });
            } catch (error) {
                if (photoPath) {
                    await upload.deleteFile(photoPath);
                }
                throw error;
            }
        })
    ],

    deleteStop: [
        asyncHandler(async (req, res) => {
            const driver = await prisma.driver.findUnique({
                where: { userId: req.user.id }
            });

            if (!driver) {
                throw ApiError.notFound('Профиль водителя не найден');
            }

            const driverId = driver.id;
            const { id } = req.params;

            try {
                const stop = await prisma.stop.findUnique({
                    where: { id: parseInt(id) }
                });

                if (!stop) {
                    throw ApiError.notFound('Остановка не найдена');
                }

                if (stop.driverId !== driverId) {
                    throw ApiError.forbidden('У вас нет прав на удаление этой остановки');
                }

                if (stop.photo) {
                    await upload.deleteFile(stop.photo);
                }

                await prisma.stop.delete({
                    where: { id: parseInt(id) }
                });

                await CacheService.clearPattern(`driver:profile:${req.user.id}`);
                await CacheService.clearPattern(`districts:${stop.districtId}:*`);

                res.json({
                    status: 'success',
                    message: 'Остановка успешно удалена'
                });
            } catch (error) {
                logError('Ошибка при удалении остановки', {
                    driverId,
                    stopId: id,
                    error: error.message,
                    stack: error.stack
                });
                throw error;
            }
        })
    ]
};

module.exports = stopController;