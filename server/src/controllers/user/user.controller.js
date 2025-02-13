const prisma = require('../../models');
const asyncHandler = require('../../utils/asyncHandler');
const { logInfo, logError, logWarning } = require('../../utils/logger');
const { cacheMiddleware } = require('../../middlewares/cache.middleware');

const usersController = {
    getClients: [
        cacheMiddleware({
            expire: 300,
            key: (req) => `clients:list:page${req.query.page || 1}:limit${req.query.limit || 10}:search${req.query.search || ''}`
        }),
        asyncHandler(async (req, res) => {
            const { page = 1, limit = 10, search } = req.query;
            const skip = (page - 1) * Number(limit);

            logInfo('Запрос на получение списка клиентов', {
                page,
                limit,
                search,
                userId: req.user.id,
                userRole: req.user.role
            });

            const where = {
                role: 'CLIENT'
            };

            if (search) {
                where.OR = [
                    { client: { name: { contains: search, mode: 'insensitive' } } },
                    { client: { phone: { contains: search, mode: 'insensitive' } } },
                    { email: { contains: search, mode: 'insensitive' } }
                ];
            }

            const [users, total] = await prisma.$transaction([
                prisma.user.findMany({
                    where,
                    include: {
                        client: {
                            select: {
                                id: true,
                                name: true,
                                phone: true,
                                address: true,
                                orders: {
                                    select: {
                                        id: true,
                                        status: true,
                                        createdAt: true
                                    },
                                    orderBy: {
                                        createdAt: 'desc'
                                    },
                                    take: 5 // Последние 5 заказов
                                }
                            }
                        }
                    },
                    skip,
                    take: Number(limit),
                    orderBy: {
                        createdAt: 'desc'
                    }
                }),
                prisma.user.count({ where })
            ]);

            const staffWithoutPasswords = users.map(user => {
                const { password: _, ...userWithoutPassword } = user;
                return {
                    ...userWithoutPassword,
                    avatar: userWithoutPassword.avatar
                        ? `${process.env.BASE_URL}/uploads/${userWithoutPassword.avatar}`
                        : null
                };
            });

            logInfo('Список клиентов успешно получен', {
                count: users.length,
                total,
                pages: Math.ceil(total / limit)
            });

            res.json({
                status: 'success',
                data: {
                    staff: staffWithoutPasswords,
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / Number(limit))
                }
            });
        })
    ],

    getEmployees: [
        cacheMiddleware({
            expire: 300,
            key: (req) => `employees:list:page${req.query.page || 1}:limit${req.query.limit || 10}:search${req.query.search || ''}:position${req.query.position || ''}`
        }),
        asyncHandler(async (req, res) => {
            const { page = 1, limit = 10, search, position } = req.query;
            const skip = (page - 1) * Number(limit);

            logInfo('Запрос на получение списка сотрудников', {
                page,
                limit,
                search,
                position,
                userId: req.user.id,
                userRole: req.user.role
            });

            const where = {
                role: 'EMPLOYEE'
            };

            if (position) {
                where.employee = {
                    position
                };
            }

            if (search) {
                where.OR = [
                    { employee: { name: { contains: search, mode: 'insensitive' } } },
                    { employee: { phone: { contains: search, mode: 'insensitive' } } },
                    { email: { contains: search, mode: 'insensitive' } }
                ];
            }

            const [users, total] = await prisma.$transaction([
                prisma.user.findMany({
                    where,
                    include: {
                        employee: {
                            select: {
                                id: true,
                                name: true,
                                phone: true,
                                position: true,
                                address: true
                            }
                        }
                    },
                    skip,
                    take: Number(limit),
                    orderBy: {
                        createdAt: 'desc'
                    }
                }),
                prisma.user.count({ where })
            ]);

            const staffWithoutPasswords = users.map(user => {
                const { password: _, ...userWithoutPassword } = user;
                return {
                    ...userWithoutPassword,
                    avatar: userWithoutPassword.avatar
                        ? `${process.env.BASE_URL}/uploads/${userWithoutPassword.avatar}`
                        : null
                };
            });

            logInfo('Список сотрудников успешно получен', {
                count: users.length,
                total,
                pages: Math.ceil(total / limit)
            });

            res.json({
                status: 'success',
                data: {
                    staff: staffWithoutPasswords,
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / Number(limit))
                }
            });
        })
    ],

    getSuppliers: [
        cacheMiddleware({
            expire: 300,
            key: (req) => `suppliers:list:page${req.query.page || 1}:limit${req.query.limit || 10}:search${req.query.search || ''}`
        }),
        asyncHandler(async (req, res) => {
            const { page = 1, limit = 10, search } = req.query;
            const skip = (page - 1) * Number(limit);

            logInfo('Запрос на получение списка поставщиков', {
                page,
                limit,
                search,
                userId: req.user.id,
                userRole: req.user.role
            });

            const where = {
                role: 'SUPPLIER'
            };

            if (search) {
                where.OR = [
                    { supplier: { companyName: { contains: search, mode: 'insensitive' } } },
                    { supplier: { contactPerson: { contains: search, mode: 'insensitive' } } },
                    { supplier: { phone: { contains: search, mode: 'insensitive' } } },
                    { email: { contains: search, mode: 'insensitive' } }
                ];
            }

            const [users, total] = await prisma.$transaction([
                prisma.user.findMany({
                    where,
                    include: {
                        supplier: {
                            select: {
                                id: true,
                                companyName: true,
                                contactPerson: true,
                                phone: true,
                                address: true,
                                inn: true,
                                ogrn: true,
                                bankAccount: true,
                                bik: true,
                                products: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    },
                    skip,
                    take: Number(limit),
                    orderBy: {
                        createdAt: 'desc'
                    }
                }),
                prisma.user.count({ where })
            ]);

            const staffWithoutPasswords = users.map(user => {
                const { password: _, ...userWithoutPassword } = user;
                return {
                    ...userWithoutPassword,
                    avatar: userWithoutPassword.avatar
                        ? `${process.env.BASE_URL}/uploads/${userWithoutPassword.avatar}`
                        : null
                };
            });

            logInfo('Список поставщиков успешно получен', {
                count: users.length,
                total,
                pages: Math.ceil(total / limit)
            });

            res.json({
                status: 'success',
                data: {
                    staff: staffWithoutPasswords,
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / Number(limit))
                }
            });
        })
    ],

    getAllUsers: [
        cacheMiddleware({
            expire: 300,
            key: (req) => `users:list:page${req.query.page || 1}:limit${req.query.limit || 10}:search${req.query.search || ''}:role${req.query.role || ''}`
        }),
        asyncHandler(async (req, res) => {
            logInfo('Начало обработки запроса getAllUsers', {
                userId: req.user.id,
                userRole: req.user.role,
                requestBody: req.body,
                requestQuery: req.query
            });

            try {
                const adminUser = await prisma.user.findFirst({
                    where: {
                        id: req.user.id,
                        role: 'ADMIN'
                    },
                    include: {
                        admin: true
                    }
                });

                logInfo('Результат проверки админа:', {
                    adminFound: !!adminUser,
                    adminData: adminUser,
                    isSuperAdmin: adminUser?.admin?.isSuperAdmin
                });

                if (!adminUser?.admin?.isSuperAdmin) {
                    logWarning('Попытка несанкционированного доступа к списку пользователей', {
                        userId: req.user.id,
                        userRole: req.user.role,
                        adminStatus: adminUser?.admin
                    });
                    return res.status(403).json({
                        status: 'error',
                        message: 'Доступ запрещен. Требуются права суперадминистратора'
                    });
                }

                const { page = 1, limit = 10, search, role } = req.query;
                const skip = (page - 1) * Number(limit);

                logInfo('Параметры запроса пользователей', {
                    page,
                    limit,
                    search,
                    role
                });

                const where = {};

                if (role) {
                    where.role = role;
                }

                if (search) {
                    where.OR = [
                        { email: { contains: search, mode: 'insensitive' } },
                        { admin: { name: { contains: search, mode: 'insensitive' } } },
                        { client: { name: { contains: search, mode: 'insensitive' } } },
                        { employee: { name: { contains: search, mode: 'insensitive' } } },
                        { supplier: { companyName: { contains: search, mode: 'insensitive' } } },
                        { driver: { name: { contains: search, mode: 'insensitive' } } }
                    ];
                }

                const [users, total] = await prisma.$transaction([
                    prisma.user.findMany({
                        where,
                        include: {
                            admin: true,
                            client: {
                                include: {
                                    orders: {
                                        select: {
                                            id: true,
                                            status: true,
                                            createdAt: true
                                        },
                                        orderBy: {
                                            createdAt: 'desc'
                                        },
                                        take: 5
                                    }
                                }
                            },
                            employee: true,
                            supplier: {
                                include: {
                                    products: {
                                        select: {
                                            id: true,
                                            name: true
                                        }
                                    }
                                }
                            },
                            driver: {
                                include: {
                                    districts: true,
                                    stops: {
                                        orderBy: {
                                            stopTime: 'desc'
                                        },
                                        take: 5
                                    }
                                }
                            }
                        },
                        skip,
                        take: Number(limit),
                        orderBy: {
                            createdAt: 'desc'
                        }
                    }),
                    prisma.user.count({ where })
                ]);

                logInfo('Получены пользователи из БД', {
                    usersCount: users.length,
                    totalCount: total
                });

                const staffWithoutPasswords = users.map(user => {
                    const { password: _, ...userWithoutPassword } = user;
                    return {
                        ...userWithoutPassword,
                        avatar: userWithoutPassword.avatar
                            ? `${process.env.BASE_URL}/uploads/${userWithoutPassword.avatar}`
                            : null
                    };
                });

                res.json({
                    status: 'success',
                    data: {
                        staff: staffWithoutPasswords,
                        total,
                        page: parseInt(page),
                        pages: Math.ceil(total / Number(limit))
                    }
                });
            } catch (error) {
                logError('Ошибка при получении списка пользователей', {
                    error: error.message,
                    stack: error.stack,
                    userId: req.user.id,
                    userRole: req.user.role
                });
                throw error;
            }
        })
    ]
};

module.exports = usersController;