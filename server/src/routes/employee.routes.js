const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile/profile.controller');
const { auth, checkRole } = require('../middlewares/auth.middleware');
const { employeeValidators } = require('../validators/employee.validator');
const {avatar} = require("../middlewares/upload.middleware");
const validate = require("../middlewares/validate.middleware");

/**
 * @swagger
 * tags:
 *   name: Employee
 *   description: Управление профилем сотрудников
 */

/**
 * @swagger
 * /api/employee/profile:
 *   get:
 *     tags:
 *       - Employee
 *     summary: Получение профиля сотрудника
 *     description: Получает информацию о профиле авторизованного сотрудника
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     responses:
 *       200:
 *         description: Профиль сотрудника
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmployeeProfileResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
    '/profile',
    auth,
    checkRole(['EMPLOYEE']),
    profileController.getProfile
);

/**
 * @swagger
 * components:
 *   schemas:
 *     EmployeeProfileUpdateRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Имя сотрудника
 *           example: Иван Иванов
 *         phone:
 *           type: string
 *           description: Номер телефона сотрудника
 *           example: +79001234567
 *         position:
 *           type: string
 *           description: Должность сотрудника
 *           example: Старший менеджер
 *         address:
 *           type: string
 *           description: Адрес сотрудника
 *           example: г. Москва, ул. Пушкина, д. 1
 *
 *     EmployeeProfileResponse:
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
 *               description: Уникальный идентификатор сотрудника
 *             name:
 *               type: string
 *               description: Имя сотрудника
 *             phone:
 *               type: string
 *               description: Номер телефона сотрудника
 *             position:
 *               type: string
 *               description: Должность сотрудника
 *             address:
 *               type: string
 *               description: Адрес сотрудника
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
 *             tasks:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   status:
 *                     type: string
 *                     enum: [TODO, IN_PROGRESS, COMPLETED, CANCELLED]
 *                   priority:
 *                     type: string
 *                     enum: [LOW, MEDIUM, HIGH]
 *                   dueDate:
 *                     type: string
 *                     format: date-time
 *             workTimes:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   startTime:
 *                     type: string
 *                     format: date-time
 *                   endTime:
 *                     type: string
 *                     format: date-time
 *                   date:
 *                     type: string
 *                     format: date-time
 *         message:
 *           type: string
 *           example: Профиль успешно обновлен
 *
 * /api/employee/profile:
 *   put:
 *     tags:
 *       - Employee
 *     summary: Обновление профиля сотрудника
 *     description: Обновляет информацию профиля авторизованного сотрудника
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeProfileUpdateRequest'
 *     responses:
 *       200:
 *         description: Профиль успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmployeeProfileResponse'
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
    checkRole(['EMPLOYEE']),
    employeeValidators.updateProfileValidation,
    profileController.updateProfile
);

/**
 * @swagger
 * /api/employee/profile/avatar:
 *   post:
 *     tags:
 *       - Employee
 *     summary: Загрузка аватара сотрудника
 *     description: Загружает новый аватар для профиля сотрудника
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
 */
router.post(
    '/profile/avatar',
    auth,
    checkRole(['EMPLOYEE']),
    avatar.single('avatar'),
    validate,
    profileController.updateAvatar
);
module.exports = router;
