const express = require('express');
const router = express.Router();
const twoFactorController = require('../controllers/auth/twoFactorAuth.controller');
const { auth } = require('../middlewares/auth.middleware');
const csrfProtection = require("../middlewares/csrfProtection.middleware");
const {enableValidation, verifyValidation, verify2FALoginValidation,
    trustedDeviceValidation,
    backupCodeValidation
} = require("../validators/twoFactor.validator");
const {deactivate2FAByEmail} = require("../controllers/email/email.controller");

/**
 * @swagger
 * tags:
 *   name: TwoFactor Authentication
 *   description: Маршруты для управления двухфакторной аутентификацией
 */

/**
 * @swagger
 *  /api/2fa/enable:
 *   post:
 *     tags: [TwoFactor Authentication]
 *     summary: Включение 2FA
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     responses:
 *       200:
 *         description: QR код для настройки 2FA
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 qrCode:
 *                   type: string
 *                   description: QR код в формате base64
 *                 secret:
 *                   type: string
 *                   description: Секретный ключ
 */
router.post('/enable',
    csrfProtection,
    auth,
    twoFactorController.enable
);

/**
 * @swagger
 * /api/2fa/verify-setup:
 *   post:
 *     tags: [TwoFactor Authentication]
 *     summary: Подтверждение настройки 2FA
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Код подтверждения
 *     responses:
 *       200:
 *         description: 2FA успешно активирован
 */
router.post('/verify-setup',
    csrfProtection,
    auth,
    verifyValidation,
    twoFactorController.verify
);

/**
 * @swagger
 * /api/2fa/disable:
 *   post:
 *     tags: [TwoFactor Authentication]
 *     summary: Запрос на отключение 2FA
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     responses:
 *       200:
 *         description: 2FA успешно отключен
 */
router.post('/disable',
    csrfProtection,
    auth,
    twoFactorController.disable
);

/**
 * @swagger
 * /api/2fa/deactivate:
 *   get:
 *     tags: [TwoFactor Authentication]
 *     summary: Деактивация 2FA по ссылке из письма
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Токен для деактивации 2FA
 *     responses:
 *       200:
 *         description: 2FA успешно отключен
 */
router.get(
    '/deactivate',
    deactivate2FAByEmail
);

/**
 * @swagger
 * /api/2fa/verify-login:
 *   post:
 *     tags: [TwoFactor Authentication]
 *     summary: Подтверждение входа с 2FA
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tempToken:
 *                 type: string
 *               twoFactorCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Вход подтвержден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tokens'
 */
router.post('/verify-login',
    csrfProtection,
    verify2FALoginValidation,
    twoFactorController.verify2FALogin
);

/**
 * @swagger
 * /api/2fa/trusted-device:
 *   post:
 *     tags: [TwoFactor Authentication]
 *     summary: Добавление доверенного устройства
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceId:
 *                 type: string
 *                 description: Уникальный идентификатор устройства
 *     responses:
 *       200:
 *         description: Устройство успешно добавлено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Устройство добавлено в список доверенных
 *       400:
 *         description: Ошибка добавления устройства
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Это устройство уже доверенное
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Отсутствует CSRF токен
 */
router.post('/trusted-device',
    csrfProtection,
    auth,
    trustedDeviceValidation,
    twoFactorController.addTrustedDevice
);

/**
 * @swagger
 * /api/2fa/trusted-device:
 *   delete:
 *     tags: [TwoFactor Authentication]
 *     summary: Удаление доверенного устройства
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceId:
 *                 type: string
 *                 description: Идентификатор доверенного устройства
 *     responses:
 *       200:
 *         description: Устройство успешно удалено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Устройство удалено из списка доверенных
 *       400:
 *         description: Ошибка удаления
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Устройство не найдено
 */
router.delete('/trusted-device',
    csrfProtection,
    auth,
    trustedDeviceValidation,
    twoFactorController.removeTrustedDevice
);

/**
 * @swagger
 * /api/2fa/verify-backup:
 *   post:
 *     tags: [TwoFactor Authentication]
 *     summary: Проверка резервного кода
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Резервный код для верификации
 *     responses:
 *       200:
 *         description: Код успешно проверен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Резервный код успешно использован
 *       400:
 *         description: Ошибка проверки кода
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Неверный резервный код
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Отсутствует CSRF токен
 */
router.post('/backup-codes',
    csrfProtection,
    auth,
    twoFactorController.generateBackupCodes
);

/**
 * @swagger
 * /api/2fa/verify-backup:
 *   post:
 *     tags: [TwoFactor Authentication]
 *     summary: Проверка резервного кода
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Резервный код успешно использован
 *       400:
 *         description: Неверный или использованный код
 */
router.post('/verify-backup',
    csrfProtection,
    auth,
    backupCodeValidation,
    twoFactorController.verifyBackupCode
);

module.exports = router;
