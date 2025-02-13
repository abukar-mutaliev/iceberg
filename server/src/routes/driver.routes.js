const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile/profile.controller');
const { auth, checkRole } = require('../middlewares/auth.middleware');
const { driverValidators } = require('../validators/driver.validator');
const { avatar } = require("../middlewares/upload.middleware");
const validate = require("../middlewares/validate.middleware");

/**
 * @swagger
 * tags:
 *   name: Driver
 *   description: Управление профилем водителей
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DriverProfileUpdateRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Имя водителя
 *           example: Иван Иванов
 *         phone:
 *           type: string
 *           description: Номер телефона водителя
 *           example: +79001234567
 *         districts:
 *           type: array
 *           items:
 *             type: integer
 *           description: ID районов, в которых работает водитель
 *           example: [1, 2, 3]
 *
 *     DriverProfileResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               description: Уникальный идентификатор водителя
 *             name:
 *               type: string
 *               description: Имя водителя
 *             phone:
 *               type: string
 *               description: Номер телефона водителя
 *             user:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                   format: email
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 avatar:
 *                   type: string
 *                   nullable: true
 *             districts:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *             stops:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   address:
 *                     type: string
 *                   photo:
 *                     type: string
 *                   mapLocation:
 *                     type: string
 *                   stopTime:
 *                     type: string
 *                     format: date-time
 *                   district:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 */

/**
 * @swagger
 * /api/driver/profile:
 *   get:
 *     tags:
 *       - Driver
 *     summary: Получение профиля водителя
 *     description: Получает информацию о профиле авторизованного водителя, включая районы и последние остановки
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     responses:
 *       200:
 *         description: Профиль водителя
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DriverProfileResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
    '/profile',
    auth,
    checkRole(['DRIVER']),
    profileController.getProfile
);

/**
 * @swagger
 * /api/driver/profile:
 *   put:
 *     tags:
 *       - Driver
 *     summary: Обновление профиля водителя
 *     description: Обновляет информацию профиля авторизованного водителя
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DriverProfileUpdateRequest'
 *     responses:
 *       200:
 *         description: Профиль успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DriverProfileResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put(
    '/profile',
    auth,
    checkRole(['DRIVER']),
    driverValidators.updateProfileValidation,
    profileController.updateProfile
);

/**
 * @swagger
 * /api/driver/profile/avatar:
 *   post:
 *     tags:
 *       - Driver
 *     summary: Загрузка аватара водителя
 *     description: Загружает новый аватар для профиля водителя
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Файл изображения для аватара
 *     responses:
 *       200:
 *         description: Аватар успешно обновлен
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
 *                     avatar:
 *                       type: string
 *                       description: Путь к файлу аватара
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post(
    '/profile/avatar',
    auth,
    checkRole(['DRIVER']),
    avatar.single('avatar'),
    validate,
    profileController.updateAvatar
);

module.exports = router;