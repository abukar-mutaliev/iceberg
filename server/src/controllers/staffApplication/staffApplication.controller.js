const prisma = require('../../models');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/errors/ApiError');
const { logInfo, logWarning, logError} = require('../../utils/logger');

const getName = (email) => {
    if (!email) return 'Неизвестно';
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
};

const staffApplicationController = {
    applyForStaff: asyncHandler(async (req, res) => {
        const { desiredRole, districts } = req.body;

        if (!['EMPLOYEE', 'SUPPLIER', 'DRIVER'].includes(desiredRole)) {
            throw ApiError.badRequest('Некорректная роль для заявки');
        }

        // Проверяем существование районов для водителя
        if (desiredRole === 'DRIVER' && districts) {
            // Преобразуем districts в массив, если это не массив
            const districtsArray = Array.isArray(districts) ? districts : [districts];

            const existingDistricts = await prisma.district.findMany({
                where: {
                    id: {
                        in: districtsArray.map(id => parseInt(id))
                    }
                }
            });

            if (existingDistricts.length !== districtsArray.length) {
                throw ApiError.badRequest('Некоторые указанные районы не существуют');
            }
        }

        const existingApp = await prisma.staffApplication.findFirst({
            where: { userId: req.user.id, status: 'PENDING' }
        });
        if (existingApp) {
            throw ApiError.badRequest('У вас уже есть активная заявка');
        }

        const newApplication = await prisma.staffApplication.create({
            data: {
                userId: req.user.id,
                desiredRole,
                districts: districts ? (Array.isArray(districts) ? districts.join(',') : districts.toString()) : null
            }
        });

        logInfo('Новая заявка на роль сотрудника/поставщика/водителя', {
            userId: req.user.id,
            desiredRole,
            districts: districts ? (Array.isArray(districts) ? districts.join(', ') : districts.toString()) : null
        });

        res.status(201).json({
            status: 'success',
            data: { application: newApplication },
            message: 'Заявка успешно отправлена'
        });
    }),

    approveApplication: asyncHandler(async (req, res) => {
        const { applicationId } = req.params;
        const { position, districts } = req.body;

        const user = req.user;
        if (user.role !== 'ADMIN') {
            throw ApiError.forbidden('Только администратор может утверждать заявки');
        }

        const application = await prisma.staffApplication.findUnique({
            where: { id: Number(applicationId) },
            include: {
                user: {
                    include: {
                        employee: true,
                        supplier: true,
                        driver: true
                    }
                }
            }
        });

        if (!application) {
            throw ApiError.notFound('Заявка не найдена');
        }

        if (application.status !== 'PENDING') {
            throw ApiError.badRequest('Заявка уже обработана');
        }

        if (application.desiredRole === 'EMPLOYEE' && !position) {
            throw ApiError.badRequest('Необходимо указать должность для сотрудника');
        }

        let districtsList = districts || application.districts?.split(',');
        if (application.desiredRole === 'DRIVER' && districtsList) {
            const existingDistricts = await prisma.district.findMany({
                where: {
                    id: {
                        in: districtsList.map(id => parseInt(id))
                    }
                }
            });

            if (existingDistricts.length !== districtsList.length) {
                throw ApiError.badRequest('Некоторые указанные районы не существуют');
            }
        }

        try {
            const updatedUser = await prisma.$transaction(async (prisma) => {
                if (application.user.employee) {
                    await prisma.employee.deleteMany({
                        where: { userId: application.userId }
                    });
                }
                if (application.user.supplier) {
                    await prisma.supplier.deleteMany({
                        where: { userId: application.userId }
                    });
                }
                if (application.user.driver) {
                    await prisma.driver.deleteMany({
                        where: { userId: application.userId }
                    });
                }

                const user = await prisma.user.update({
                    where: { id: application.userId },
                    data: { role: application.desiredRole }
                });

                switch (application.desiredRole) {
                    case 'EMPLOYEE':
                        await prisma.employee.create({
                            data: {
                                userId: application.userId,
                                name: getName(application.user.email),
                                position: position
                            }
                        });
                        break;

                    case 'SUPPLIER':
                        await prisma.supplier.create({
                            data: {
                                userId: application.userId,
                                companyName: getName(application.user.email),
                                contactPerson: getName(application.user.email)
                            }
                        });
                        break;

                    case 'DRIVER':
                        await prisma.driver.create({
                            data: {
                                userId: application.userId,
                                name: getName(application.user.email),
                                ...(districtsList && {
                                    districts: {
                                        connect: districtsList.map(id => ({
                                            id: parseInt(id)
                                        }))
                                    }
                                })
                            }
                        });
                        break;
                }

                await prisma.staffApplication.update({
                    where: { id: application.id },
                    data: { status: 'APPROVED' }
                });

                return prisma.user.findUnique({
                    where: { id: application.userId },
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
            });

            logInfo('Заявка одобрена', {
                approvedBy: user.id,
                userId: application.userId,
                newRole: application.desiredRole,
                position,
                districts: districtsList?.join(', ')
            });

            res.json({
                status: 'success',
                message: 'Заявка одобрена',
                data: { user: updatedUser }
            });
        } catch (error) {
            logError('Ошибка при обновлении пользователя:', error);
            throw ApiError.internal('Ошибка при обработке заявки');
        }
    }),

    rejectApplication: asyncHandler(async (req, res) => {
        const { applicationId } = req.params;

        const user = req.user;
        if (user.role !== 'ADMIN') {
            throw ApiError.forbidden('Только администратор может отклонять заявки');
        }

        const application = await prisma.staffApplication.findUnique({
            where: { id: Number(applicationId) },
            include: { user: true }
        });
        if (!application) {
            throw ApiError.notFound('Заявка не найдена');
        }
        if (application.status !== 'PENDING') {
            throw ApiError.badRequest('Заявка уже обработана');
        }

        await prisma.staffApplication.update({
            where: { id: application.id },
            data: { status: 'REJECTED' }
        });

        logInfo('Заявка отклонена', {
            rejectedBy: user.id,
            userId: application.userId,
            desiredRole: application.desiredRole
        });

        res.json({
            status: 'success',
            message: 'Заявка отклонена'
        });
    }),

    getAllApplications: asyncHandler(async (req, res) => {
        const user = req.user;
        if (user.role !== 'ADMIN') {
            throw ApiError.forbidden('Только администратор может просматривать заявки');
        }

        const applications = await prisma.staffApplication.findMany({
            where: { status: 'PENDING' },
            include: {
                user: true
            }
        });

        res.json({
            status: 'success',
            data: { applications }
        });
    })
};

module.exports = staffApplicationController;