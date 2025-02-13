const express = require('express');
const router = express.Router();
const districtController = require('../controllers/district/district.controller');
const { auth, checkRole } = require('../middlewares/auth.middleware');
const { districtValidators } = require('../validators/district.validator');
const validate = require("../middlewares/validate.middleware");

/**
 * @swagger
 * tags:
 *   name: Districts
 *   description: Управление районами
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DistrictCreateRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Название района
 *           example: Центральный район
 *         description:
 *           type: string
 *           description: Описание района
 *           example: Исторический центр города
 *
 *     DistrictUpdateRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Название района
 *           example: Центральный район
 *         description:
 *           type: string
 *           description: Описание района
 *           example: Исторический центр города
 *
 *     DistrictResponse:
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
 *               description: Уникальный идентификатор района
 *             name:
 *               type: string
 *               description: Название района
 *             description:
 *               type: string
 *               description: Описание района
 *             drivers:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   phone:
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
 *                   stopTime:
 *                     type: string
 *                     format: date-time
 *             _count:
 *               type: object
 *               properties:
 *                 clients:
 *                   type: integer
 *                 drivers:
 *                   type: integer
 *                 stops:
 *                   type: integer
 */

/**
 * @swagger
 * /api/districts:
 *   get:
 *     tags:
 *       - Districts
 *     summary: Получение списка всех районов
 *     description: Получает список всех районов с количеством связанных водителей, клиентов и остановок
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     responses:
 *       200:
 *         description: Список районов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DistrictResponse'
 */
router.get(
    '/',
    auth,
    districtController.getAll
);

/**
 * @swagger
 * /api/districts/{id}:
 *   get:
 *     tags:
 *       - Districts
 *     summary: Получение информации о районе
 *     description: Получает детальную информацию о конкретном районе
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID района
 *     responses:
 *       200:
 *         description: Информация о районе
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DistrictResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
    '/:id',
    auth,
    districtController.getOne
);

/**
 * @swagger
 * /api/districts:
 *   post:
 *     tags:
 *       - Districts
 *     summary: Создание нового района
 *     description: Создает новый район (доступно только администраторам)
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DistrictCreateRequest'
 *     responses:
 *       201:
 *         description: Район успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DistrictResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post(
    '/',
    auth,
    checkRole(['ADMIN']),
    districtValidators.createValidation,
    validate,
    districtController.create
);

/**
 * @swagger
 * /api/districts/{id}:
 *   put:
 *     tags:
 *       - Districts
 *     summary: Обновление района
 *     description: Обновляет информацию о районе (доступно только администраторам)
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID района
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DistrictUpdateRequest'
 *     responses:
 *       200:
 *         description: Район успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DistrictResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
    '/:id',
    auth,
    checkRole(['ADMIN']),
    districtValidators.updateValidation,
    validate,
    districtController.update
);

/**
 * @swagger
 * /api/districts/{id}:
 *   delete:
 *     tags:
 *       - Districts
 *     summary: Удаление района
 *     description: Удаляет район (доступно только администраторам)
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID района
 *     responses:
 *       200:
 *         description: Район успешно удален
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
 *                   example: Район успешно удален
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
    '/:id',
    auth,
    checkRole(['ADMIN']),
    districtController.delete
);

module.exports = router;