const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin/admin.controller');
const { auth, checkRole } = require('../middlewares/auth.middleware');
const { createAdminValidation, createStaffValidation, changeRoleValidation} = require('../validators/admin.validator');
const validate = require('../middlewares/validate.middleware');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Маршруты для управления администраторами и персоналом
 */

/**
 * @swagger
 * /api/admin/admins:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Создание нового администратора
 *     description: Создает нового администратора. Только для суперадмина.
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminCreateRequest'
 *     responses:
 *       201:
 *         description: Администратор успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminResponse'
 *       400:
 *         description: Ошибка валидации или пользователь с таким email уже существует
 *       403:
 *         description: Только суперадминистратор может назначать администраторов
 */
router.post(
    '/admins',
    auth,
    checkRole(['ADMIN']),
    createAdminValidation,
    validate,
    adminController.createAdmin
);

/**
 * @swagger
 * /api/admin/staff:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Создание сотрудника или поставщика
 *     description: Создает нового сотрудника или поставщика. Доступно для всех администраторов.
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StaffCreateRequest'
 *     responses:
 *       201:
 *         description: Сотрудник или поставщик успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/EmployeeResponse'
 *                 - $ref: '#/components/schemas/SupplierResponse'
 *       400:
 *         description: Ошибка валидации или пользователь с таким email уже существует
 *       403:
 *         description: Только суперадминистратор может назначать администраторов
 */
router.post(
    '/staff',
    auth,
    checkRole(['ADMIN']),
    createStaffValidation,
    validate,
    adminController.createStaff
);

/**
 * @swagger
 * /api/admin/staff:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Получение списка всех сотрудников и поставщиков
 *     description: Возвращает список всех сотрудников и поставщиков. Доступно для всех администраторов.
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     responses:
 *       200:
 *         description: Список сотрудников и поставщиков
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
 *                     staff:
 *                       type: array
 *                       items:
 *                         oneOf:
 *                           - $ref: '#/components/schemas/Employee'
 *                           - $ref: '#/components/schemas/Supplier'
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Нет прав доступа
 */
router.get(
    '/staff',
    auth,
    checkRole(['ADMIN']),
    adminController.getStaffList
);


/**
 * @swagger
 * /api/admin/change-role/{userId}:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Изменение роли пользователя
 *     description: Изменяет роль клиента на сотрудника или поставщика. Доступно только для суперадмина.
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID пользователя, которому нужно изменить роль
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newRole
 *             properties:
 *               newRole:
 *                 type: string
 *                 enum: [EMPLOYEE, SUPPLIER]
 *                 description: Новая роль пользователя
 *               position:
 *                 type: string
 *                 description: Должность (обязательно для EMPLOYEE)
 *               companyName:
 *                 type: string
 *                 description: Название компании (обязательно для SUPPLIER)
 *               contactPerson:
 *                 type: string
 *                 description: Контактное лицо (обязательно для SUPPLIER)
 *     responses:
 *       200:
 *         description: Роль пользователя успешно изменена
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
 *                   example: Пользователь успешно переведен в роль сотрудника
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       oneOf:
 *                         - $ref: '#/components/schemas/Employee'
 *                         - $ref: '#/components/schemas/Supplier'
 *       400:
 *         description: Ошибка валидации, недопустимая роль или невозможно изменить роль данного пользователя
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Только суперадмин может изменять роли пользователей
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
router.patch(
    '/change-role/:userId',
    auth,
    checkRole(['ADMIN']),
    changeRoleValidation,
    validate,
    adminController.changeUserRole
);

/**
 * @swagger
 * /api/admin/admins:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Получение списка всех администраторов
 *     description: Возвращает список всех администраторов. Только для суперадмина.
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     responses:
 *       200:
 *         description: Список администраторов
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
 *                     admins:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Admin'
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Только суперадминистратор может просматривать список администраторов
 */
router.get(
    '/admins',
    auth,
    checkRole(['ADMIN']),
    adminController.getAdminsList
);

/**
 * @swagger
 * /api/admin/admins/{adminId}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Удаление администратора
 *     description: Удаляет администратора по ID. Только для суперадмина. Суперадминистратор не может удалить себя.
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID администратора, которого нужно удалить
 *     responses:
 *       200:
 *         description: Администратор успешно удален
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
 *                   example: Администратор успешно удален
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Только суперадминистратор может удалять администраторов или попытка удалить суперадминистратора
 *       404:
 *         description: Администратор не найден
 */
router.delete(
    '/admins/:adminId',
    auth,
    checkRole(['ADMIN']),
    adminController.deleteAdmin
);

/**
 * @swagger
 * /api/admin/staff/{userId}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Удаление сотрудника или поставщика
 *     description: Удаляет сотрудника или поставщика по ID. Только для суперадмина.
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID пользователя, которого нужно удалить (EMPLOYEE или SUPPLIER)
 *     responses:
 *       200:
 *         description: Сотрудник или поставщик успешно удален
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
 *                   example: Сотрудник успешно удален
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Только суперадминистратор может удалять сотрудников или поставщиков
 *       400:
 *         description: Можно удалять только сотрудников или поставщиков
 *       404:
 *         description: Пользователь не найден
 */
router.delete(
    '/staff/:userId',
    auth,
    checkRole(['ADMIN']),
    adminController.deleteStaff
);

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminCreateRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Электронная почта администратора
 *         password:
 *           type: string
 *           description: Пароль администратора
 *         name:
 *           type: string
 *           description: Имя администратора
 *         phone:
 *           type: string
 *           description: Номер телефона администратора
 *         address:
 *           type: string
 *           description: Адрес администратора
 *     AdminResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         data:
 *           type: object
 *           properties:
 *             admin:
 *               $ref: '#/components/schemas/Admin'
 *         message:
 *           type: string
 *           example: Администратор успешно создан
 *     StaffCreateRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - role
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
 *           enum: [EMPLOYEE, SUPPLIER]
 *           description: Роль пользователя
 *         name:
 *           type: string
 *           description: Имя сотрудника (только для EMPLOYEE)
 *         position:
 *           type: string
 *           description: Должность сотрудника (только для EMPLOYEE)
 *         companyName:
 *           type: string
 *           description: Название компании (только для SUPPLIER)
 *         contactPerson:
 *           type: string
 *           description: Контактное лицо (только для SUPPLIER)
 *         phone:
 *           type: string
 *           description: Номер телефона
 *         address:
 *           type: string
 *           description: Адрес
 *     EmployeeResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         data:
 *           type: object
 *           properties:
 *             staff:
 *               $ref: '#/components/schemas/Employee'
 *         message:
 *           type: string
 *           example: Сотрудник успешно создан
 *     SupplierResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         data:
 *           type: object
 *           properties:
 *             staff:
 *               $ref: '#/components/schemas/Supplier'
 *         message:
 *           type: string
 *           example: Поставщик успешно создан
 *     Admin:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: string
 *           enum: [ADMIN]
 *         admin:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             phone:
 *               type: string
 *             address:
 *               type: string
 *             isSuperAdmin:
 *               type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Employee:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: string
 *           enum: [EMPLOYEE]
 *         employee:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             phone:
 *               type: string
 *             position:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Supplier:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: string
 *           enum: [SUPPLIER]
 *         supplier:
 *           type: object
 *           properties:
 *             companyName:
 *               type: string
 *             contactPerson:
 *               type: string
 *             phone:
 *               type: string
 *             address:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

module.exports = router;
