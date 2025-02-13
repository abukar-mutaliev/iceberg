const prisma = require('../../models');
const bcrypt = require('bcryptjs');
const ApiError = require('../../utils/errors/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const { logInfo, logWarning, logError } = require('../../utils/logger');
const path = require('path');
const fs = require('fs/promises');

const adminController = {
    createAdmin: asyncHandler(async (req, res) => {
        const superAdmin = await prisma.admin.findFirst({
            where: {
                userId: req.user.id,
                isSuperAdmin: true
            }
        });

        if (!superAdmin) {
            throw ApiError.forbidden('Только супер-администратор может назначать администраторов');
        }

        const { email, password, name, phone, address } = req.body;

        if (!email || !password || !name) {
            throw ApiError.badRequest('Недостаточно данных для создания администратора');
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            throw ApiError.badRequest('Пользователь с таким email уже существует');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: 'ADMIN',
                admin: {
                    create: {
                        name,
                        phone,
                        address,
                        isSuperAdmin: false
                    }
                }
            },
            include: {
                admin: true
            }
        });

        logInfo('Создан новый администратор', {
            createdBy: req.user.id,
            newAdminId: admin.id
        });

        const { password: _, ...adminWithoutPassword } = admin;

        res.status(201).json({
            status: 'success',
            data: { admin: adminWithoutPassword },
            message: 'Администратор успешно создан'
        });
    }),

    createStaff: asyncHandler(async (req, res) => {
        const {
            role,
            email,
            password,
            name,
            phone,
            position,
            companyName,
            contactPerson,
            address,
            inn,
            ogrn,
            bankAccount,
            bik,
            districts
        } = req.body;

        if (!['EMPLOYEE', 'SUPPLIER', 'DRIVER'].includes(role)) {
            throw ApiError.badRequest('Недопустимая роль');
        }

        if (!email || !password) {
            throw ApiError.badRequest('Недостаточно данных для создания пользователя');
        }

        if (role === 'DRIVER' && !name) {
            throw ApiError.badRequest('Для водителя необходимо указать имя');
        }

        if (role === 'SUPPLIER' && (inn || ogrn)) {
            const existingSupplier = await prisma.supplier.findFirst({
                where: {
                    OR: [
                        { inn: inn || undefined },
                        { ogrn: ogrn || undefined }
                    ]
                }
            });

            if (existingSupplier) {
                throw ApiError.badRequest('Поставщик с таким ИНН или ОГРН уже существует');
            }
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            throw ApiError.badRequest('Пользователь с таким email уже существует');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const staff = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role,
                ...(role === 'EMPLOYEE' && {
                    employee: {
                        create: {
                            name,
                            phone,
                            position
                        }
                    }
                }),
                ...(role === 'SUPPLIER' && {
                    supplier: {
                        create: {
                            companyName,
                            contactPerson,
                            phone,
                            address,
                            inn,
                            ogrn,
                            bankAccount,
                            bik
                        }
                    }
                }),
                ...(role === 'DRIVER' && {
                    driver: {
                        create: {
                            name,
                            phone,
                            address,
                            ...(districts && {
                                districts: {
                                    connect: districts.map(id => ({ id: parseInt(id) }))
                                }
                            })
                        }
                    }
                })
            },
            include: {
                employee: true,
                supplier: true,
                driver: {
                    include: {
                        districts: true
                    }
                }
            }
        });

        logInfo(`Создан новый ${
            role === 'EMPLOYEE' ? 'сотрудник' :
                role === 'SUPPLIER' ? 'поставщик' : 'водитель'
        }`, {
            createdBy: req.user.id,
            newStaffId: staff.id,
            role,
            ...(role === 'SUPPLIER' && {
                inn,
                companyName
            }),
            ...(role === 'DRIVER' && {
                districts: districts?.join(', ')
            })
        });

        const { password: _, ...staffWithoutPassword } = staff;

        res.status(201).json({
            status: 'success',
            data: { staff: staffWithoutPassword },
            message: `${
                role === 'EMPLOYEE' ? 'Сотрудник' :
                    role === 'SUPPLIER' ? 'Поставщик' : 'Водитель'
            } успешно создан`
        });
    }),

    getAdminsList: asyncHandler(async (req, res) => {
        const superAdmin = await prisma.admin.findFirst({
            where: {
                userId: req.user.id,
                isSuperAdmin: true
            }
        });

        if (!superAdmin) {
            throw ApiError.forbidden('Только супер-администратор может просматривать список администраторов');
        }

        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            include: {
                admin: true
            }
        });

        const adminsWithoutPasswords = admins.map(admin => {
            const { password: _, ...adminWithoutPassword } = admin;
            return adminWithoutPassword;
        });

        res.json({
            status: 'success',
            data: { admins: adminsWithoutPasswords }
        });
    }),

    getStaffList: asyncHandler(async (req, res) => {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const [staff, total] = await Promise.all([
            prisma.user.findMany({
                where: {
                    role: {
                        in: ['EMPLOYEE', 'SUPPLIER', 'DRIVER']
                    }
                },
                include: {
                    employee: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            position: true,
                            address: true
                        }
                    },
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
                    },
                    driver: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            address: true,
                            districts: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            },
                            stops: {
                                select: {
                                    id: true,
                                    address: true,
                                    stopTime: true
                                },
                                orderBy: {
                                    stopTime: 'desc'
                                },
                                take: 5
                            }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: parseInt(limit)
            }),
            prisma.user.count({
                where: {
                    role: {
                        in: ['EMPLOYEE', 'SUPPLIER', 'DRIVER']
                    }
                }
            })
        ]);

        const staffWithoutPasswords = staff.map(user => {
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });

        const totalPages = Math.ceil(total / limit);

        res.json({
            status: 'success',
            data: {
                staff: staffWithoutPasswords,
                total,
                page: parseInt(page),
                pages: totalPages
            }
        });
    }),

    changeUserRole: asyncHandler(async (req, res) => {
        const { userId } = req.params;
        const {
            newRole,
            position,
            companyName,
            contactPerson,
            name,
            inn,
            ogrn,
            bankAccount,
            bik,
            address,
            phone,
            districts
        } = req.body;

        logInfo('Попытка изменения роли пользователя', {
            userId,
            newRole,
            requestBody: req.body,
            requesterId: req.user.id
        });

        const VALID_ROLES = ['EMPLOYEE', 'SUPPLIER', 'ADMIN', 'CLIENT', 'DRIVER'];

        if (!VALID_ROLES.includes(newRole)) {
            logError('Попытка установить недопустимую роль', {
                providedRole: newRole,
                validRoles: VALID_ROLES,
                userId,
                requesterId: req.user.id
            });
            throw ApiError.badRequest('Недопустимая роль');
        }

        const superAdmin = await prisma.admin.findFirst({
            where: {
                userId: req.user.id,
                isSuperAdmin: true
            }
        });

        if (!superAdmin) {
            throw ApiError.forbidden('Только супер-администратор может изменять роли пользователей');
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            include: {
                client: true,
                employee: true,
                supplier: true,
                admin: true,
                driver: true
            }
        });

        if (!user) {
            throw ApiError.notFound('Пользователь не найден');
        }

        try {
            await prisma.$transaction(async (prisma) => {
                if (user.client) await prisma.client.delete({ where: { userId: user.id } });
                if (user.employee) await prisma.employee.delete({ where: { userId: user.id } });
                if (user.supplier) await prisma.supplier.delete({ where: { userId: user.id } });
                if (user.driver) await prisma.driver.delete({ where: { userId: user.id } });
                if (user.admin && !user.admin.isSuperAdmin) {
                    await prisma.admin.delete({ where: { userId: user.id } });
                }

                logInfo('Старые роли пользователя удалены', {
                    userId: user.id,
                    oldRole: user.role
                });

                switch (newRole) {
                    case 'DRIVER':
                        if (!name) {
                            throw ApiError.badRequest('Для водителя необходимо указать имя');
                        }
                        await prisma.driver.create({
                            data: {
                                userId: user.id,
                                name: name || (user.client?.name || 'Не указано'),
                                phone: phone || (user.client?.phone || 'Не указано'),
                                address: address || (user.client?.address || 'Не указано'),
                                ...(districts && {
                                    districts: {
                                        connect: districts.map(id => ({ id: parseInt(id) }))
                                    }
                                })
                            }
                        });
                        break;

                    case 'EMPLOYEE':
                        if (!position) {
                            throw ApiError.badRequest('Для сотрудника необходимо указать должность');
                        }
                        await prisma.employee.create({
                            data: {
                                userId: user.id,
                                name: name || (user.client?.name || 'Не указано'),
                                phone: phone || (user.client?.phone || 'Не указано'),
                                position,
                                address: address || (user.client?.address || 'Не указано')
                            }
                        });
                        break;

                    case 'SUPPLIER':
                        if (!companyName || !contactPerson) {
                            throw ApiError.badRequest('Для поставщика необходимо указать название компании и контактное лицо');
                        }

                        if (inn || ogrn) {
                            const existingSupplier = await prisma.supplier.findFirst({
                                where: {
                                    OR: [
                                        { inn: inn || undefined },
                                        { ogrn: ogrn || undefined }
                                    ],
                                    NOT: {
                                        userId: user.id
                                    }
                                }
                            });

                            if (existingSupplier) {
                                throw ApiError.badRequest('Поставщик с таким ИНН или ОГРН уже существует');
                            }
                        }

                        await prisma.supplier.create({
                            data: {
                                userId: user.id,
                                companyName,
                                contactPerson,
                                phone: phone || (user.client?.phone || 'Не указано'),
                                address: address || (user.client?.address || 'Не указано'),
                                inn: inn || undefined,
                                ogrn: ogrn || undefined,
                                bankAccount: bankAccount || undefined,
                                bik: bik || undefined
                            }
                        });
                        break;

                    case 'ADMIN':
                        await prisma.admin.create({
                            data: {
                                userId: user.id,
                                name: name || (user.client?.name || 'Не указано'),
                                phone: phone || (user.client?.phone || 'Не указано'),
                                address: address || (user.client?.address || 'Не указано'),
                                isSuperAdmin: false
                            }
                        });
                        break;

                    case 'CLIENT':
                        await prisma.client.create({
                            data: {
                                userId: user.id,
                                name: name || (user.client?.name || 'Не указано'),
                                phone: phone || (user.client?.phone || 'Не указано'),
                                address: address || (user.client?.address || 'Не указано')
                            }
                        });
                        break;
                }
                await prisma.user.update({
                    where: { id: user.id },
                    data: { role: newRole }
                });
            });

            logInfo('Роль пользователя успешно изменена', {
                userId: user.id,
                oldRole: user.role,
                newRole,
                changedBy: req.user.id,
                ...(newRole === 'DRIVER' && {
                    districts: districts?.join(', ')
                })
            });

            const roleNames = {
                'EMPLOYEE': 'сотрудника',
                'SUPPLIER': 'поставщика',
                'ADMIN': 'администратора',
                'CLIENT': 'клиента',
                'DRIVER': 'водителя'
            };

            res.json({
                status: 'success',
                message: `Пользователь успешно переведен в роль ${roleNames[newRole]}`
            });

        } catch (error) {
            logError('Ошибка при изменении роли пользователя', {
                userId: user.id,
                newRole,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }),

    deleteAdmin: asyncHandler(async (req, res) => {
        const { adminId } = req.params;
        const targetUserId = parseInt(adminId);

        logInfo('Запрос на удаление администратора', {
            targetUserId,
            requesterId: req.user.id
        });

        const superAdmin = await prisma.admin.findFirst({
            where: {
                userId: req.user.id,
                isSuperAdmin: true
            }
        });

        if (!superAdmin) {
            logWarning('Попытка удаления администратора без прав суперадмина', {
                requesterId: req.user.id
            });
            throw ApiError.forbidden('Только супер-администратор может удалять администраторов');
        }

        if (targetUserId === req.user.id) {
            logWarning('Попытка самоудаления суперадмина', {
                requesterId: req.user.id
            });
            throw ApiError.forbidden('Суперадминистратор не может удалить самого себя');
        }

        const targetUser = await prisma.user.findFirst({
            where: {
                id: targetUserId,
                role: 'ADMIN'
            },
            include: {
                admin: true
            }
        });

        if (!targetUser) {
            logError('Пользователь-администратор не найден', {
                targetUserId,
                requesterId: req.user.id
            });
            throw ApiError.notFound('Администратор не найден');
        }

        if (targetUser.admin?.isSuperAdmin) {
            logWarning('Попытка удаления суперадмина', {
                targetUserId,
                requesterId: req.user.id
            });
            throw ApiError.forbidden('Невозможно удалить супер-администратора');
        }

        if (targetUser.admin) {
            await prisma.admin.delete({
                where: {
                    userId: targetUserId
                }
            });
        }

        await prisma.user.delete({
            where: {
                id: targetUserId
            }
        });

        logInfo('Администратор успешно удален', {
            deletedUserId: targetUserId,
            deletedAdminId: targetUser.admin?.id,
            deletedBy: req.user.id,
            hadAdminRecord: !!targetUser.admin
        });

        return res.json({
            status: 'success',
            message: 'Администратор успешно удален'
        });
    }),


    deleteStaff: asyncHandler(async (req, res) => {
        const { userId } = req.params;

        const superAdmin = await prisma.admin.findFirst({
            where: {
                userId: req.user.id,
                isSuperAdmin: true
            }
        });

        if (!superAdmin) {
            throw ApiError.forbidden('Только супер-администратор может удалять сотрудников, водителей или поставщиков');
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            include: {
                driver: {
                    include: {
                        stops: true
                    }
                }
            }
        });

        if (!targetUser) {
            throw ApiError.notFound('Пользователь не найден');
        }

        if (!['EMPLOYEE', 'SUPPLIER', 'DRIVER'].includes(targetUser.role)) {
            throw ApiError.badRequest('Можно удалять только сотрудников, водителей или поставщиков');
        }

        const getRoleName = (role) => {
            switch (role) {
                case 'EMPLOYEE':
                    return 'Сотрудник';
                case 'SUPPLIER':
                    return 'Поставщик';
                case 'DRIVER':
                    return 'Водитель';
                default:
                    return 'Пользователь';
            }
        };

        try {
            await prisma.$transaction(async (prisma) => {
                if (targetUser.role === 'DRIVER' && targetUser.driver?.stops?.length > 0) {
                    for (const stop of targetUser.driver.stops) {
                        if (stop.photo) {
                            const photoPath = path.join(process.env.UPLOAD_DIR || 'uploads', stop.photo);
                            try {
                                await fs.access(photoPath);
                                await fs.unlink(photoPath);
                            } catch (err) {
                                logError('Ошибка при удалении фото остановки:', {
                                    stopId: stop.id,
                                    photoPath,
                                    error: err.message
                                });
                            }
                        }
                    }
                }

                await prisma.user.delete({
                    where: { id: parseInt(userId) }
                });
            });

            logInfo(`${getRoleName(targetUser.role)} успешно удален`, {
                deletedBy: req.user.id,
                deletedUserId: userId,
                deletedUserRole: targetUser.role,
                ...(targetUser.role === 'DRIVER' && {
                    stopsCount: targetUser.driver?.stops?.length || 0
                })
            });

            res.json({
                status: 'success',
                message: `${getRoleName(targetUser.role)} успешно удален`
            });
        } catch (error) {
            logError('Ошибка при удалении пользователя:', {
                userId,
                error: error.message,
                stack: error.stack,
                code: error.code
            });

            if (error.code === 'P2025') {
                throw ApiError.notFound('Пользователь не найден');
            }
            if (error.code === 'P2003') {
                throw ApiError.badRequest('Невозможно удалить пользователя из-за связанных данных');
            }
            throw ApiError.internal('Ошибка при удалении пользователя');
        }
    })
};

module.exports = adminController;
