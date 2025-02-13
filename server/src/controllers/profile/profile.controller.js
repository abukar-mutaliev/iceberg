const prisma = require('../../models');
const bcrypt = require('bcryptjs');
const ApiError = require('../../utils/errors/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const {logInfo, logError, logWarning} = require('../../utils/logger');
const {validationResult} = require('express-validator');
const {cacheMiddleware, clearCache} = require('../../middlewares/cache.middleware');
const CacheService = require('../../services/cache.service');
const upload = require('../../middlewares/upload.middleware');

const profileController = {
    getProfile: [
        cacheMiddleware({
            expire: 300,
            key: (req) => {
                if (!req.user || !req.user.role) {
                    throw new ApiError(401, 'Unauthorized');
                }

                const roleMapping = {
                    'ADMIN': 'admin',
                    'CLIENT': 'client',
                    'EMPLOYEE': 'employee',
                    'SUPPLIER': 'supplier',
                    'DRIVER': 'driver'
                };

                const relationName = roleMapping[req.user.role];
                if (!relationName) {
                    throw new ApiError(400, 'Invalid role');
                }

                return `${relationName}:profile:${req.user.id}`;
            }
        }),
        asyncHandler(async (req, res) => {
            if (!req.user || !req.user.role) {
                throw new ApiError(401, 'Unauthorized');
            }

            const roleMapping = {
                'ADMIN': 'admin',
                'CLIENT': 'client',
                'EMPLOYEE': 'employee',
                'SUPPLIER': 'supplier',
                'DRIVER': 'driver'
            };

            const relationName = roleMapping[req.user.role];
            if (!relationName) {
                throw new ApiError(400, 'Invalid role');
            }

            try {
                const profile = await prisma[relationName].findUnique({
                    where: {userId: req.user.id},
                });

                if (!profile) {
                    throw ApiError.notFound(`Профиль ${relationName} не найден`);
                }

                const profileId = profile.id;

                let fullProfile;

                switch (relationName) {
                    case 'supplier':
                        fullProfile = await prisma.supplier.findUnique({
                            where: {id: profileId},
                            include: {
                                user: {
                                    select: {
                                        email: true,
                                        createdAt: true,
                                        avatar: true
                                    }
                                },
                                products: {
                                    where: {isActive: true},
                                    select: {
                                        id: true,
                                        name: true,
                                        price: true,
                                        stockQuantity: true,
                                        status: true
                                    },
                                    take: 5
                                },
                                supplies: {
                                    select: {
                                        id: true,
                                        quantity: true,
                                        status: true,
                                        deliveryDate: true,
                                        product: {
                                            select: {
                                                name: true
                                            }
                                        }
                                    },
                                    orderBy: {
                                        createdAt: 'desc'
                                    },
                                    take: 5
                                }
                            }
                        });
                        break;

                    case 'driver':
                        fullProfile = await prisma.driver.findUnique({
                            where: {id: profileId},
                            include: {
                                user: {
                                    select: {
                                        email: true,
                                        createdAt: true,
                                        avatar: true
                                    }
                                },
                                districts: {
                                    select: {
                                        id: true,
                                        name: true,
                                        description: true
                                    }
                                },
                                stops: {
                                    select: {
                                        id: true,
                                        address: true,
                                        photo: true,
                                        mapLocation: true,
                                        stopTime: true,
                                        district: {
                                            select: {
                                                name: true
                                            }
                                        }
                                    },
                                    orderBy: {
                                        stopTime: 'desc'
                                    },
                                    take: 5
                                }
                            }
                        });
                        break;

                    case 'employee':
                        fullProfile = await prisma.employee.findUnique({
                            where: {id: profileId},
                            include: {
                                user: {
                                    select: {
                                        email: true,
                                        createdAt: true,
                                        avatar: true
                                    }
                                },
                                tasks: {
                                    select: {
                                        id: true,
                                        title: true,
                                        status: true,
                                        priority: true,
                                        dueDate: true
                                    },
                                    where: {
                                        status: {
                                            not: 'COMPLETED'
                                        }
                                    },
                                    orderBy: {
                                        dueDate: 'asc'
                                    },
                                    take: 5
                                },
                                workTimes: {
                                    select: {
                                        id: true,
                                        startTime: true,
                                        endTime: true,
                                        date: true
                                    },
                                    orderBy: {
                                        date: 'desc'
                                    },
                                    take: 5
                                }
                            }
                        });
                        break;

                    case 'client':
                        fullProfile = await prisma.client.findUnique({
                            where: {id: profileId},
                            include: {
                                user: {
                                    select: {
                                        email: true,
                                        createdAt: true,
                                        avatar: true
                                    }
                                },
                                district: {
                                    select: {
                                        id: true,
                                        name: true,
                                        description: true
                                    }
                                },
                                orders: {
                                    select: {
                                        id: true,
                                        orderNumber: true,
                                        status: true,
                                        totalAmount: true,
                                        createdAt: true,
                                        expectedDeliveryDate: true
                                    },
                                    orderBy: {
                                        createdAt: 'desc'
                                    },
                                    take: 5
                                },
                                preferences: {
                                    select: {
                                        keywords: true
                                    }
                                },
                                feedback: {
                                    select: {
                                        id: true,
                                        rating: true,
                                        comment: true,
                                        createdAt: true,
                                        product: {
                                            select: {
                                                name: true
                                            }
                                        }
                                    },
                                    orderBy: {
                                        createdAt: 'desc'
                                    },
                                    take: 5
                                }
                            }
                        });
                        break;

                    case 'admin':
                        fullProfile = await prisma.admin.findUnique({
                            where: {id: profileId},
                            include: {
                                user: {
                                    select: {
                                        email: true,
                                        createdAt: true,
                                        avatar: true
                                    }
                                }
                            }
                        });
                        break;
                }

                if (!fullProfile) {
                    throw ApiError.notFound(`Профиль ${relationName} не найден в базе данных`);
                }

                if (fullProfile.user && fullProfile.user.avatar) {
                    fullProfile.user.avatar = `${process.env.BASE_URL}/uploads/${fullProfile.user.avatar}`;
                }

                if (relationName === 'driver' && fullProfile.stops) {
                    fullProfile.stops = fullProfile.stops.map(stop => ({
                        ...stop,
                        photo: stop.photo ? `${process.env.BASE_URL}/uploads/${stop.photo}` : null
                    }));
                }

                const cleanProfile = Object.fromEntries(
                    Object.entries(fullProfile).filter(([_, value]) => {
                        if (Array.isArray(value)) {
                            return value.length > 0;
                        }
                        return true;
                    })
                );

                res.json({
                    status: 'success',
                    data: cleanProfile
                });
            } catch (error) {
                logError(`Ошибка при получении профиля ${relationName}`, {
                    userId: req.user.id,
                    error: error.message,
                    stack: error.stack
                });
                throw error;
            }
        })
    ],
    updateProfile: [
        clearCache((req) => {
            const roleMapping = {
                'ADMIN': 'admin',
                'CLIENT': 'client',
                'EMPLOYEE': 'employee',
                'SUPPLIER': 'supplier',
                'DRIVER': 'driver'
            };
            const relationName = roleMapping[req.user.role];
            return `${relationName}:profile:${req.user.id}`;
        }),
        asyncHandler(async (req, res) => {
            const roleMapping = {
                'ADMIN': 'admin',
                'CLIENT': 'client',
                'EMPLOYEE': 'employee',
                'SUPPLIER': 'supplier',
                'DRIVER': 'driver'
            };

            const relationName = roleMapping[req.user.role];
            const userId = req.user.id;

            try {
                const profile = await prisma[relationName].findUnique({
                    where: {userId: userId}
                });

                if (!profile) {
                    throw ApiError.notFound('Профиль не найден');
                }

                const profileId = profile.id;

                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    throw ApiError.badRequest('Ошибка валидации', errors.array());
                }

                const updateData = {};
                const {
                    name,
                    phone,
                    address,
                    position,
                    districts,
                    companyName,
                    contactPerson,
                    inn,
                    ogrn,
                    bankAccount,
                    bik,
                    districtId
                } = req.body;

                if (name !== undefined) updateData.name = name.trim();
                if (phone !== undefined) {
                    if (phone && !/^\+?[0-9]{10,15}$/.test(phone)) {
                        throw ApiError.badRequest('Некорректный формат телефона');
                    }
                    updateData.phone = phone.trim();
                }
                if (address !== undefined) updateData.address = address.trim();

                switch (relationName) {
                    case 'employee':
                        if (position !== undefined) {
                            updateData.position = position.trim();
                        }
                        break;

                    case 'driver':
                        if (Array.isArray(districts)) {
                            updateData.districts = {
                                set: districts.map(id => ({id}))
                            };
                        }
                        break;

                    case 'supplier':
                        if (companyName !== undefined) updateData.companyName = companyName.trim();
                        if (contactPerson !== undefined) updateData.contactPerson = contactPerson.trim();
                        if (inn !== undefined) {
                            if (inn && !/^[0-9]{10,12}$/.test(inn)) {
                                throw ApiError.badRequest('Некорректный формат ИНН');
                            }
                            updateData.inn = inn.trim();
                        }
                        if (ogrn !== undefined) {
                            if (ogrn && !/^[0-9]{13,15}$/.test(ogrn)) {
                                throw ApiError.badRequest('Некорректный формат ОГРН');
                            }
                            updateData.ogrn = ogrn.trim();
                        }
                        if (bankAccount !== undefined) {
                            if (bankAccount && !/^[0-9]{20}$/.test(bankAccount)) {
                                throw ApiError.badRequest('Некорректный формат расчетного счета');
                            }
                            updateData.bankAccount = bankAccount.trim();
                        }
                        if (bik !== undefined) {
                            if (bik && !/^[0-9]{9}$/.test(bik)) {
                                throw ApiError.badRequest('Некорректный формат БИК');
                            }
                            updateData.bik = bik.trim();
                        }
                        break;

                    case 'client':
                        if (districtId !== undefined) {
                            if (districtId) {
                                const district = await prisma.district.findUnique({
                                    where: {id: districtId}
                                });
                                if (!district) {
                                    throw ApiError.badRequest('Указанный район не существует');
                                }
                                updateData.districtId = districtId;
                            } else {
                                updateData.districtId = null;
                            }
                        }
                        break;
                }

                if (Object.keys(updateData).length === 0) {
                    return res.json({
                        status: 'success',
                        data: profile,
                        message: 'Нет данных для обновления'
                    });
                }

                const includeOptions = {
                    user: {
                        select: {
                            email: true,
                            createdAt: true,
                            avatar: true
                        }
                    }
                };

                switch (relationName) {
                    case 'driver':
                        includeOptions.districts = true;
                        includeOptions.stops = {
                            orderBy: {stopTime: 'desc'},
                            take: 5
                        };
                        break;
                    case 'supplier':
                        includeOptions.products = {
                            where: {isActive: true},
                            take: 5
                        };
                        includeOptions.supplies = {
                            orderBy: {createdAt: 'desc'},
                            take: 5
                        };
                        break;
                    case 'employee':
                        includeOptions.tasks = {
                            where: {status: {not: 'COMPLETED'}},
                            orderBy: {dueDate: 'asc'},
                            take: 5
                        };
                        includeOptions.workTimes = {
                            orderBy: {date: 'desc'},
                            take: 5
                        };
                        break;
                    case 'client':
                        includeOptions.district = true;
                        includeOptions.orders = {
                            orderBy: {createdAt: 'desc'},
                            take: 5
                        };
                        includeOptions.preferences = true;
                        break;
                }

                const updatedProfile = await prisma[relationName].update({
                    where: {id: profileId},
                    data: updateData,
                    include: includeOptions
                });


                if (updatedProfile.user?.avatar) {
                    updatedProfile.user.avatar = `${process.env.BASE_URL}/uploads/${updatedProfile.user.avatar}`;
                }

                if (relationName === 'driver' && updatedProfile.stops) {
                    updatedProfile.stops = updatedProfile.stops.map(stop => ({
                        ...stop,
                        photo: stop.photo ? `${process.env.BASE_URL}/uploads/${stop.photo}` : null
                    }));
                }

                await CacheService.set(
                    `${relationName}:profile:${profileId}`,
                    {
                        status: 'success',
                        data: updatedProfile
                    },
                    300
                );

                res.json({
                    status: 'success',
                    data: updatedProfile,
                    message: 'Профиль успешно обновлен'
                });
            } catch (error) {
                logError('Ошибка при обновлении профиля:', {
                    error: error.message,
                    profileId,
                    userId,
                    role: relationName
                });

                if (error instanceof ApiError) {
                    throw error;
                }

                if (error.code === 'P2002') {
                    throw ApiError.badRequest('Данное значение уже используется');
                }

                throw ApiError.internal('Ошибка при обновлении профиля');
            }
        })
    ],

    updateAvatar: [
        clearCache((req) => `${req.user.role.toLowerCase()}:profile:${req.user.id}`),

        (req, res, next) => {
            const maxSize = 5 * 1024 * 1024;
            if (req.file && req.file.size > maxSize) {
                return next(ApiError.badRequest('Размер файла не должен превышать 5MB'));
            }
            next();
        },

        asyncHandler(async (req, res) => {
            const userId = req.user.id;
            const role = req.user.role.toLowerCase();
            let newAvatarPath = null;

            try {
                const profile = await prisma[role].findUnique({
                    where: {userId: userId}
                });

                if (!profile) {
                    throw ApiError.notFound('Профиль не найден');
                }

                const profileId = profile.id;

                if (!req.file) {
                    throw ApiError.badRequest('Файл не загружен');
                }

                const user = await prisma.user.findUnique({
                    where: {id: userId},
                    select: {
                        id: true,
                        avatar: true
                    }
                });

                if (!user) {
                    throw ApiError.notFound('Пользователь не найден');
                }

                newAvatarPath = await upload.saveFile(req.file, 'avatars');

                const updatedUser = await prisma.user.update({
                    where: {id: userId},
                    data: {avatar: newAvatarPath}
                });

                if (user.avatar) {
                    await upload.deleteFile(user.avatar);
                }

                await CacheService.clearPattern(`${role}:profile:${profileId}`);

                res.json({
                    status: 'success',
                    data: {
                        avatar: `${process.env.BASE_URL}/uploads/${updatedUser.avatar}`
                    },
                    message: 'Аватар успешно обновлен'
                });
            } catch (error) {
                if (newAvatarPath) {
                    await upload.deleteFile(newAvatarPath);
                }

                logError('Ошибка при обновлении аватара:', {
                    userId,
                    role,
                    error: error.message
                });

                if (error instanceof ApiError) {
                    throw error;
                }

                throw ApiError.internal('Ошибка при обновлении аватара');
            }
        })
    ],

    changePassword: [
        asyncHandler(async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw ApiError.badRequest('Ошибка валидации', errors.array());
            }

            const userId = req.user.id;
            const {currentPassword, newPassword} = req.body;

            try {
                const user = await prisma.user.findUnique({
                    where: {id: userId},
                    select: {
                        id: true,
                        password: true
                    }
                });

                if (!user) {
                    throw ApiError.notFound('Пользователь не найден');
                }

                const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
                if (!isPasswordValid) {
                    throw ApiError.badRequest('Неверный текущий пароль');
                }

                const isSamePassword = await bcrypt.compare(newPassword, user.password);
                if (isSamePassword) {
                    throw ApiError.badRequest('Новый пароль должен отличаться от текущего');
                }

                const hashedPassword = await bcrypt.hash(newPassword, 10);

                await prisma.user.update({
                    where: {id: userId},
                    data: {password: hashedPassword}
                });

                await prisma.refreshToken.updateMany({
                    where: {userId: userId},
                    data: {isValid: false}
                });

                const token = req.headers.authorization?.split(' ')[1];
                if (token) {
                    await prisma.invalidToken.create({
                        data: {
                            token: token,
                            userId: userId,
                            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // токен будет недействителен 24 часа
                        }
                    });
                }

                logInfo('Пароль успешно изменен', {
                    userId,
                    role: req.user.role
                });

                res.json({
                    status: 'success',
                    message: 'Пароль успешно изменен. Пожалуйста, войдите в систему снова.'
                });
            } catch (error) {
                logError('Ошибка при смене пароля:', {
                    userId,
                    error: error.message,
                    stack: error.stack
                });

                if (error instanceof ApiError) {
                    throw error;
                }

                throw ApiError.internal('Ошибка при смене пароля');
            }
        })
    ]
};

module.exports = profileController;