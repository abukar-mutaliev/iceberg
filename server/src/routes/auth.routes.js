const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth/auth.controller');
const { auth, refreshToken, logout } = require('../middlewares/auth.middleware');
const csrfProtection = require("../middlewares/csrfProtection.middleware");

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Маршруты для регистрации, входа и управления сессиями
 */

/**
 * @swagger
 * /api/auth/register/initiate:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Инициация процесса регистрации
 *     description: Начинает процесс регистрации, проверяет данные и отправляет код подтверждения на email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - phone
 *               - address
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email пользователя
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: Пароль пользователя
 *                 example: Pass123
 *               name:
 *                 type: string
 *                 description: Имя пользователя
 *                 example: Иван Иванов
 *               phone:
 *                 type: string
 *                 description: Номер телефона
 *                 example: +79001234567
 *               address:
 *                 type: string
 *                 description: Адрес пользователя
 *                 example: г. Москва, ул. Примерная, д. 1
 *     responses:
 *       200:
 *         description: Код подтверждения отправлен на email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: pending
 *                 message:
 *                   type: string
 *                   example: На ваш email отправлен код подтверждения
 *                 registrationToken:
 *                   type: string
 *                   description: Токен для завершения регистрации
 *       400:
 *         description: Ошибка валидации или пользователь уже существует
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Ошибка отправки email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register/initiate', authController.initiateRegister);


/**
 * @swagger
 * /api/auth/register/complete:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Завершение регистрации
 *     description: Завершает процесс регистрации после подтверждения кода с email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - registrationToken
 *               - verificationCode
 *             properties:
 *               registrationToken:
 *                 type: string
 *                 description: Токен, полученный на этапе инициации
 *               verificationCode:
 *                 type: string
 *                 description: Код подтверждения, отправленный на email
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: Регистрация успешно завершена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: JWT токен доступа
 *                     refreshToken:
 *                       type: string
 *                       description: Токен для обновления доступа
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: Регистрация успешно завершена
 *       400:
 *         description: Неверный код подтверждения или истекший токен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Недействительный токен регистрации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register/complete', authController.completeRegister);


/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Вход пользователя
 *     description: Аутентифицирует пользователя и возвращает токены доступа и обновления
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLoginRequest'
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     tokens:
 *                       $ref: '#/components/schemas/Tokens'
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: Вход выполнен успешно
 *       400:
 *         description: Ошибка валидации или некорректные данные
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Неверный email или пароль
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Обновление токенов
 *     description: Обновляет токены доступа и обновления, используя действительный refreshToken
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Токены успешно обновлены
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tokens'
 *       401:
 *         description: Неверный токен обновления
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/refresh-token', refreshToken, authController.refreshToken);

/**
 * @swagger
 * /api/auth/csrf-token:
 *   get:
 *     tags: [Authentication]
 *     summary: Получить CSRF токен
 *     responses:
 *       200:
 *         description: CSRF токен успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 csrfToken:
 *                   type: string
 */
router.get('/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Выход пользователя
 *     description: Инвалидирует текущие токены и завершает сессию пользователя
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LogoutRequest'
 *     responses:
 *       200:
 *         description: Успешный выход из системы
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Успешный выход из системы
 *       401:
 *         description: Неверный или отсутствующий токен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/logout', auth, logout, authController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Получение информации о текущем пользователе
 *     description: Возвращает информацию о пользователе, связанного с предоставленным токеном
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     responses:
 *       200:
 *         description: Информация о пользователе
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Неверный или отсутствующий токен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Пользователь не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', auth, authController.getMe);

/**
 * @swagger
 * components:
 *   schemas:
 *     UserCreateRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - role
 *         - name
 *         - phone
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Электронная почта пользователя
 *         password:
 *           type: string
 *           description: Пароль пользователя
 *         role:
 *           type: string
 *           enum: [CLIENT, EMPLOYEE]
 *           description: Роль пользователя
 *         name:
 *           type: string
 *           description: Имя пользователя
 *         phone:
 *           type: string
 *           description: Номер телефона пользователя
 *         position:
 *           type: string
 *           description: Должность пользователя (только для EMPLOYEE)
 *     UserLoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Электронная почта пользователя
 *         password:
 *           type: string
 *           description: Пароль пользователя
 *     RefreshTokenRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: JWT токен обновления
 *     LogoutRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: JWT токен обновления
 */



module.exports = router;
