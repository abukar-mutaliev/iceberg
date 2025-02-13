const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const ApiError = require('../utils/errors/ApiError');
const {logWarning, logInfo} = require("../utils/logger");

const twoFactorAuth = {
    generateSecret() {
        return speakeasy.generateSecret({
            name: process.env.APP_NAME || 'YourApp',
            length: 20
        });
    },

    verifyToken(secret, token) {
        try {
            logInfo('Попытка верификации 2FA токена', {
                tokenLength: token.length,
                secretPresent: !!secret
            });

            return speakeasy.totp.verify({
                secret: secret,
                encoding: 'base32',
                token: token,
                window: 1
            });
        } catch (error) {
            logWarning('Ошибка при верификации 2FA токена', {
                error: error.message,
                tokenLength: token.length
            });
            return false;
        }
    },

    async generateQRCode(secret) {
        try {
            const appName = process.env.APP_NAME || 'YourApp';
            const otpauthUrl = `otpauth://totp/${appName}?secret=${secret.base32}&issuer=${appName}`;
            logInfo('Генерация QR кода', { appName });
            return await QRCode.toDataURL(otpauthUrl);
        } catch (error) {
            logWarning('Ошибка генерации QR кода', { error: error.message });
            throw ApiError.internal('Ошибка генерации QR кода');
        }
    },

    require2FA(req, res, next) {
        if (!req.user.twoFactorEnabled) {
            return next();
        }

        const token = req.headers['x-2fa-token'];
        if (!token) {
            throw ApiError.forbidden('Требуется 2FA токен');
        }

        const isValid = twoFactorAuth.verifyToken(req.user.twoFactorSecret, token);
        if (!isValid) {
            throw ApiError.forbidden('Неверный 2FA токен');
        }

        next();
    }
};

module.exports = twoFactorAuth;