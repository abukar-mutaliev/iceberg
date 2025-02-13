const prisma = require('../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const authValidators = require('../../validators/auth.validator');
const ApiError = require('../../utils/errors/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const {  logInfo, logError } = require("../../utils/logger");
const { sendVerificationCode } = require("../email/email.controller");
const crypto = require('crypto');


const authController = {
    initiateRegister: [
        authValidators.registerValidation,
        asyncHandler(async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw ApiError.badRequest('Ошибка валидации', errors.array().map(err => ({
                    field: err.param,
                    message: err.msg
                })));
            }

            const { email, password, name, phone, address } = req.body;

            if (!email || !password || !name || !phone || !address) {
                throw ApiError.badRequest('Не все обязательные поля заполнены');
            }

            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                throw ApiError.badRequest('Пользователь с таким email уже существует');
            }

            const verificationCode = crypto.randomInt(100000, 999999).toString();

            const registrationToken = jwt.sign(
                {
                    email,
                    password,
                    name,
                    phone,
                    address,
                    verificationCode,
                    type: 'registration'
                },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );

            try {
                await sendVerificationCode(email, verificationCode);
                logInfo('Начало регистрации', { email });

                res.json({
                    status: 'pending',
                    message: 'На ваш email отправлен код подтверждения',
                    registrationToken
                });
            } catch (error) {
                throw ApiError.internal('Ошибка отправки кода подтверждения');
            }
        })
    ],

    completeRegister: asyncHandler(async (req, res) => {
        const { registrationToken, verificationCode } = req.body;

        if (!registrationToken || !verificationCode) {
            throw ApiError.badRequest('Отсутствуют необходимые данные');
        }

        try {
            const decoded = jwt.verify(registrationToken, process.env.JWT_SECRET);

            if (decoded.type !== 'registration') {
                throw ApiError.badRequest('Недействительный токен регистрации');
            }

            if (decoded.verificationCode.toString() !== verificationCode.toString()) {
                throw ApiError.badRequest('Неверный код подтверждения');
            }

            const existingUser = await prisma.user.findUnique({
                where: { email: decoded.email }
            });

            if (existingUser) {
                throw ApiError.badRequest('Пользователь с таким email уже существует');
            }

            const {
                email,
                password,
                name,
                phone,
                address
            } = decoded;

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role: 'CLIENT',
                    client: {
                        create: {
                            name,
                            phone,
                            address
                        }
                    }
                },
                include: {
                    client: true
                }
            });

            const accessToken = jwt.sign(
                {
                    userId: user.id,
                    role: user.role,
                    type: 'access'
                },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );

            const refreshToken = jwt.sign(
                {
                    userId: user.id,
                    type: 'refresh'
                },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '7d' }
            );

            await prisma.refreshToken.create({
                data: {
                    token: refreshToken,
                    userId: user.id,
                    isValid: true,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                }
            });

            const { password: _, ...userWithoutPassword } = user;

            logInfo('Пользователь успешно зарегистрирован', { userId: user.id });

            return res.status(201).json({
                status: 'success',
                data: {
                    accessToken,
                    refreshToken,
                    user: userWithoutPassword
                },
                message: 'Регистрация успешно завершена'
            });

        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                throw ApiError.badRequest('Недействительный или истекший токен регистрации');
            }
            if (error instanceof ApiError) throw error;
            throw ApiError.internal('Ошибка при регистрации');
        }
    }),

    login: [
        authValidators.loginValidation,
        asyncHandler(async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw ApiError.badRequest('Ошибка валидации', errors.array());
            }

            const { email, password } = req.body;

            const user = await prisma.user.findFirst({
                where: {
                    email: email
                },
                include: {
                    client: true,
                    employee: true,
                    supplier: true
                }
            });

            if (!user) {
                console.log('User not found:', email);

                throw ApiError.unauthorized('Неверный email или пароль');
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                console.log('Invalid password for user:', email);

                throw ApiError.unauthorized('Неверный email или пароль');
            }

            if (user.twoFactorEnabled) {
                const tempToken = jwt.sign(
                    {
                        userId: user.id,
                        type: '2fa-pending',
                        role: user.role
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '5m' }
                );

                return res.json({
                    status: 'pending',
                    requiresTwoFactor: true,
                    tempToken,
                    message: 'Введите код подтверждения. Код действителен 5 минут'
                });
            }
            const accessToken = jwt.sign(
                {
                    userId: user.id,
                    role: user.role,
                    type: 'access'
                },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );

            const refreshToken = jwt.sign(
                {
                    userId: user.id,
                    type: 'refresh'
                },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '7d' }
            );

            await prisma.refreshToken.create({
                data: {
                    token: refreshToken,
                    userId: user.id,
                    isValid: true,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                }
            });

            const { password: _, ...userWithoutPassword } = user;

            logInfo('Успешный вход в систему', { userId: user.id });

            res.json({
                status: 'success',
                data: {
                    accessToken,
                    refreshToken,
                    user: userWithoutPassword
                },
                message: 'Вход выполнен успешно'
            });
        })
    ],

    refreshToken: asyncHandler(async (req, res) => {
        const { refreshToken } = req.body;

        const tokenRecord = req.tokenRecord;
        const user = tokenRecord.user;

        const newAccessToken = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                type: 'access'
            },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        const newRefreshToken = jwt.sign(
            {
                userId: user.id,
                type: 'refresh'
            },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' }
        );

        await prisma.$transaction(async (prisma) => {
            await prisma.refreshToken.update({
                where: { id: tokenRecord.id },
                data: { isValid: false }
            });

            await prisma.refreshToken.deleteMany({
                where: {
                    OR: [
                        { isValid: false },
                        { expiresAt: { lte: new Date() } }
                    ],
                    userId: user.id
                }
            });

            await prisma.refreshToken.create({
                data: {
                    token: newRefreshToken,
                    userId: user.id,
                    isValid: true,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 дней
                }
            });
        });

        res.json({
            status: 'success',
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            },
            message: 'Токены успешно обновлены'
        });
    }),



    logout: asyncHandler(async (req, res) => {
        const accessToken = req.token;
        const { refreshToken } = req.body;
        const userId = req.user.id;

        // Предполагается, что middleware уже сделал необходимые действия по инвалидированию токенов
        // Можно отправить подтверждение

        res.json({
            status: 'success',
            message: 'Успешный выход из системы'
        });
    }),

    getMe: asyncHandler(async (req, res) => {
        try {
            // Проверяем наличие req.user
            if (!req.user || !req.user.id) {
                logError('Отсутствует информация о пользователе в запросе', {
                    user: req.user
                });
                throw ApiError.unauthorized('Пользователь не авторизован');
            }

            logInfo('Начало запроса информации о пользователе', {
                userId: req.user.id
            });

            // Сначала получаем базовую информацию о пользователе
            const userExists = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: { role: true }
            });

            if (!userExists) {
                logError('Пользователь не найден в базе данных', {
                    userId: req.user.id
                });
                throw ApiError.notFound('Пользователь не найден');
            }

            logInfo('Определена роль пользователя', {
                userId: req.user.id,
                role: userExists.role
            });

            // Формируем включаемые поля в зависимости от роли
            const includeFields = {
                where: { id: req.user.id },
                include: {
                    admin: userExists.role === 'ADMIN' ? {
                        select: {
                            id: true,
                            name: true,
                            isSuperAdmin: true
                        }
                    } : false,
                    client: userExists.role === 'CLIENT' ? {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            address: true
                        }
                    } : false,
                    employee: userExists.role === 'EMPLOYEE' ? {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            position: true,
                            address: true
                        }
                    } : false,
                    supplier: userExists.role === 'SUPPLIER' ? {
                        select: {
                            id: true,
                            companyName: true,
                            contactPerson: true,
                            phone: true,
                            address: true,
                            inn: true,
                            ogrn: true,
                            bankAccount: true,
                            bik: true
                        }
                    } : false,
                    driver: userExists.role === 'DRIVER' ? {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            address: true
                        }
                    } : false
                }
            };

            // Получаем полную информацию о пользователе
            const user = await prisma.user.findUnique(includeFields);

            if (!user) {
                logError('Не удалось получить детальную информацию о пользователе', {
                    userId: req.user.id,
                    role: userExists.role
                });
                throw ApiError.notFound('Не удалось получить информацию о пользователе');
            }

            const { password: _, ...userWithoutPassword } = user;

            // Формируем URL аватара
            const userData = {
                ...userWithoutPassword,
                avatar: userWithoutPassword.avatar
                    ? `${process.env.BASE_URL}/uploads/${userWithoutPassword.avatar}`
                    : null
            };

            logInfo('Успешный запрос информации о пользователе', {
                userId: user.id,
                role: user.role
            });

            res.json({
                status: 'success',
                data: {
                    user: userData
                }
            });
        } catch (error) {
            logError('Ошибка при получении информации о пользователе', {
                error: error.message,
                stack: error.stack,
                userId: req?.user?.id
            });
            throw error;
        }
    })
};

module.exports = authController;
