const express = require('express');
const router = express.Router();
const staffApplicationController = require('../controllers/staffApplication/staffApplication.controller');
const { auth, checkRole } = require('../middlewares/auth.middleware');
const staffApplicationValidators = require('../validators/staffApplication.validator');
const validate = require('../middlewares/validate.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     StaffApplicationCreateRequest:
 *       type: object
 *       required:
 *         - desiredRole
 *       properties:
 *         desiredRole:
 *           type: string
 *           enum: [DRIVER, EMPLOYEE, SUPPLIER]
 *           description: Желаемая роль
 *         districts:
 *           type: array
 *           items:
 *             type: integer
 *           description: ID районов (только для роли DRIVER)
 *           example: [1, 2, 3]
 *
 *     StaffApplicationResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         data:
 *           type: object
 *           properties:
 *             application:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 userId:
 *                   type: integer
 *                 desiredRole:
 *                   type: string
 *                   enum: [EMPLOYEE, SUPPLIER, DRIVER]
 *                 status:
 *                   type: string
 *                   enum: [PENDING, APPROVED, REJECTED]
 *                 districts:
 *                   type: string
 *                   description: Список ID районов через запятую (для водителей)
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 */

/**
 * @swagger
 * /api/staff-applications:
 *   get:
 *     tags:
 *       - StaffApplication
 *     summary: Получение списка всех заявок
 *     description: Возвращает список всех заявок на роли (только для администраторов)
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: Фильтр по статусу заявок
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [EMPLOYEE, SUPPLIER, DRIVER]
 *         description: Фильтр по желаемой роли
 *     responses:
 *       200:
 *         description: Список заявок
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StaffApplicationListResponse'
 */
router.get(
    '/',
    auth,
    checkRole(['ADMIN']),
    staffApplicationController.getAllApplications
);

/**
 * @swagger
 * /api/staff-applications/apply:
 *   post:
 *     tags:
 *       - StaffApplication
 *     summary: Подача заявки на роль
 *     description: Позволяет пользователю подать заявку на получение роли EMPLOYEE, SUPPLIER или DRIVER
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StaffApplicationCreateRequest'
 *     responses:
 *       201:
 *         description: Заявка успешно создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StaffApplicationResponse'
 */
router.post(
    '/apply',
    auth,
    staffApplicationValidators.applyForStaffValidation,
    validate,
    staffApplicationController.applyForStaff
);

/**
 * @swagger
 * /api/staff-applications/approve/{applicationId}:
 *   post:
 *     tags:
 *       - StaffApplication
 *     summary: Одобрение заявки администратором
 *     description: Позволяет администратору одобрить заявку и указать дополнительные данные для роли
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID заявки
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               position:
 *                 type: string
 *                 description: Должность (только для роли EMPLOYEE)
 *               districts:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: ID районов (только для роли DRIVER)
 *     responses:
 *       200:
 *         description: Заявка успешно одобрена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StaffApplicationApproveResponse'
 */
router.post(
    '/approve/:applicationId',
    auth,
    checkRole(['ADMIN']),
    staffApplicationController.approveApplication
);

/**
 * @swagger
 * /api/staff-applications/reject/{applicationId}:
 *   post:
 *     tags:
 *       - StaffApplication
 *     summary: Отклонение заявки администратором
 *     description: Позволяет администратору отклонить заявку
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID заявки
 *     responses:
 *       200:
 *         description: Заявка успешно отклонена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StaffApplicationRejectResponse'
 */
router.post(
    '/reject/:applicationId',
    auth,
    checkRole(['ADMIN']),
    staffApplicationController.rejectApplication
);

module.exports = router;