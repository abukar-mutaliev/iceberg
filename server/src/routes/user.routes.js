const express = require('express');
const router = express.Router();
const usersController = require('../controllers/user/user.controller');
const { auth, checkRole } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * /api/users/clients:
 *   get:
 *     tags:
 *       - Users
 *     summary: Получение списка клиентов
 *     description: Возвращает список клиентов с пагинацией и поиском. Доступно только для администраторов.
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Номер страницы
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Количество записей на странице
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поиск по имени, телефону или email
 *     responses:
 *       200:
 *         description: Список клиентов
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
 *                     clients:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Client'
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/clients', auth, checkRole(['ADMIN']), usersController.getClients);

/**
 * @swagger
 * /api/users/employees:
 *   get:
 *     tags:
 *       - Users
 *     summary: Получение списка сотрудников
 *     description: Возвращает список сотрудников с пагинацией, поиском и фильтрацией по должности. Доступно только для администраторов.
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поиск по имени, телефону или email
 *       - in: query
 *         name: position
 *         schema:
 *           type: string
 *         description: Фильтр по должности
 *     responses:
 *       200:
 *         description: Список сотрудников
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
 *                     employees:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Employee'
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 */
router.get('/employees', auth, checkRole(['ADMIN']), usersController.getEmployees);

/**
 * @swagger
 * /api/users/suppliers:
 *   get:
 *     tags:
 *       - Users
 *     summary: Получение списка поставщиков
 *     description: Возвращает список поставщиков с пагинацией и поиском. Доступно только для администраторов.
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поиск по названию компании, контактному лицу, телефону или email
 *     responses:
 *       200:
 *         description: Список поставщиков
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
 *                     suppliers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Supplier'
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 */
router.get('/suppliers', auth, checkRole(['ADMIN']), usersController.getSuppliers);

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Получение списка всех пользователей
 *     description: Возвращает список всех пользователей с пагинацией, поиском и фильтрацией по роли. Доступно только для суперадминистратора.
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Номер страницы
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Количество записей на странице
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поиск по email, имени или названию компании
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [CLIENT, EMPLOYEE, SUPPLIER, ADMIN]
 *         description: Фильтр по роли пользователя
 *     responses:
 *       200:
 *         description: Список пользователей
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
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           email:
 *                             type: string
 *                           role:
 *                             type: string
 *                             enum: [CLIENT, EMPLOYEE, SUPPLIER, ADMIN]
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                           avatar:
 *                             type: string
 *                             nullable: true
 *                           profile:
 *                             type: object
 *                             oneOf:
 *                               - $ref: '#/components/schemas/Admin'
 *                               - $ref: '#/components/schemas/Client'
 *                               - $ref: '#/components/schemas/Employee'
 *                               - $ref: '#/components/schemas/Supplier'
 *                     total:
 *                       type: integer
 *                       description: Общее количество записей
 *                     pages:
 *                       type: integer
 *                       description: Общее количество страниц
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Доступ запрещен
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
 *                   example: Доступ запрещен. Требуются права суперадминистратора
 */
router.get('/', auth, checkRole(['ADMIN']), usersController.getAllUsers);

module.exports = router;