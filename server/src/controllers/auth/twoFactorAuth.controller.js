const prisma = require('../../models');
const twoFactorAuth = require('../../middlewares/twoFactorAuth.middleware');
const ApiError = require('../../utils/errors/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const { logInfo, logWarning } = require('../../utils/logger');
const crypto = require('crypto');
const jwt = require("jsonwebtoken");
const {sendDeactivationEmail} = require("../email/email.controller");
const { validationResult } = require('express-validator');

const twoFactorController = {
    enable: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const secret = twoFactorAuth.generateSecret();
        const qrCode = await twoFactorAuth.generateQRCode(secret);

        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret.base32 }
        });

        logInfo('Сгенерирован секрет 2FA', { userId });

        res.json({
            qrCode,
            secret: secret.base32,
            message: 'Отсканируйте QR код в приложении аутентификации'
        });
    }),

    verify: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw ApiError.badRequest('Ошибка валидации', errors.array());
        }

        const { token } = req.body;
        const userId = req.user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user || !user.twoFactorSecret) {
            throw ApiError.badRequest('Секрет 2FA не найден');
        }

        const normalizedToken = token.toString().replace(/\s/g, '');
        const isValid = twoFactorAuth.verifyToken(user.twoFactorSecret, normalizedToken);

        if (!isValid) {
            logWarning('Неверный код 2FA', { userId });
            throw ApiError.badRequest('Неверный код подтверждения');
        }

        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: true }
        });

        logInfo('2FA успешно активирован', { userId });

        res.json({
            status: 'success',
            message: '2FA успешно активирован'
        });
    }),

    verify2FALogin: asyncHandler(async (req, res) => {
        const { tempToken, twoFactorCode } = req.body;

        if (!tempToken || !twoFactorCode) {
            throw ApiError.badRequest('Отсутствуют необходимые данные');
        }
        try {
            const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);

            if (decoded.type !== '2fa-pending') {
                throw ApiError.unauthorized('Неверный тип токена');
            }

            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                include: {
                    client: true,
                    employee: true,
                    supplier: true
                }
            });

            if (!user) {
                throw ApiError.unauthorized('Пользователь не найден');
            }

            const isCodeValid = twoFactorAuth.verifyToken(user.twoFactorSecret, twoFactorCode);
            if (!isCodeValid) {
                throw ApiError.unauthorized('Неверный код 2FA');
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

            const { password: _, twoFactorSecret: __, ...userWithoutSensitive } = user;

            res.json({
                status: 'success',
                data: {
                    accessToken,
                    refreshToken,
                    user: userWithoutSensitive
                },
                message: '2FA верификация успешна'
            });
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw ApiError.unauthorized('Время действия кода подтверждения истекло. Пожалуйста, войдите снова');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw ApiError.unauthorized('Недействительный токен подтверждения');
            }
            throw error;
        }
    }),

    disable: asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        const token = jwt.sign(
            { userId },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        await sendDeactivationEmail(user.email, token);

        logInfo('Отправлено письмо для отключения 2FA', { userId });

        res.json({
            message: 'Письмо с инструкциями для отключения 2FA отправлено на email.'
        });
    }),

    addTrustedDevice: asyncHandler(async (req, res) => {
        const { deviceId } = req.body;

        const existingDevice = await prisma.trustedDevice.findUnique({
            where: { deviceId }
        });

        if (existingDevice) {
            throw ApiError.badRequest('Это устройство уже доверенное');
        }

        await prisma.trustedDevice.create({
            data: {
                deviceId,
                userId: req.user.id
            }
        });

        res.json({ message: 'Устройство добавлено в список доверенных' });
    }),

    removeTrustedDevice: asyncHandler(async (req, res) => {
        const { deviceId } = req.body;

        const deletedDevice = await prisma.trustedDevice.delete({
            where: { deviceId }
        });

        if (!deletedDevice) {
            throw ApiError.badRequest('Устройство не найдено');
        }

        res.json({ message: 'Устройство удалено из списка доверенных' });
    }),

    generateBackupCodes: asyncHandler(async (req, res) => {
        const codes = [];
        for (let i = 0; i < 5; i++) {
            const code = crypto.randomBytes(3).toString('hex');
            codes.push(code);
            await prisma.backupCode.create({
                data: {
                    code,
                    userId: req.user.id
                }
            });
        }

        res.json({ message: 'Резервные коды сгенерированы', codes });
    }),

    verifyBackupCode: asyncHandler(async (req, res) => {
        const { code } = req.body;

        const backupCode = await prisma.backupCode.findUnique({
            where: { code }
        });

        if (!backupCode) {
            throw ApiError.badRequest('Неверный резервный код');
        }

        if (backupCode.usedAt) {
            throw ApiError.badRequest('Этот код уже использовался');
        }

        await prisma.backupCode.update({
            where: { code },
            data: { usedAt: new Date() }
        });

        res.json({ message: 'Резервный код успешно использован' });
    }),
};

module.exports = twoFactorController;