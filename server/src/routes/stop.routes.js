const express = require('express');
const router = express.Router();
const stopController = require('../controllers/driver/stop.controller');
const { auth, checkRole } = require('../middlewares/auth.middleware');
const { stopValidators } = require('../validators/stop.validator');
const validate = require("../middlewares/validate.middleware");
const { stop } = require("../middlewares/upload.middleware");

/**
 * @swagger
 * tags:
 *   name: Stops
 *   description: Управление остановками водителей
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     StopCreateRequest:
 *       type: object
 *       required:
 *         - districtId
 *         - address
 *         - mapLocation
 *         - stopTime
 *       properties:
 *         districtId:
 *           type: integer
 *           description: ID района
 *         address:
 *           type: string
 *           description: Адрес остановки
 *         mapLocation:
 *           type: string
 *           description: Координаты остановки (формат "latitude,longitude")
 *           example: "55.7558,37.6173"
 *         stopTime:
 *           type: string
 *           format: date-time
 *           description: Время остановки
 *
 *     StopUpdateRequest:
 *       type: object
 *       properties:
 *         address:
 *           type: string
 *           description: Адрес остановки
 *         mapLocation:
 *           type: string
 *           description: Координаты остановки (формат "latitude,longitude")
 *           example: "55.7558,37.6173"
 *         stopTime:
 *           type: string
 *           format: date-time
 *           description: Время остановки
 *
 *     StopResponse:
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
 *             driverId:
 *               type: integer
 *             districtId:
 *               type: integer
 *             address:
 *               type: string
 *             photo:
 *               type: string
 *               nullable: true
 *             mapLocation:
 *               type: string
 *             stopTime:
 *               type: string
 *               format: date-time
 *             district:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 */

/**
 * @swagger
 * /api/stops:
 *   get:
 *     tags:
 *       - Stops
 *     summary: Получение списка остановок водителя
 *     description: Получает список всех остановок авторизованного водителя
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     responses:
 *       200:
 *         description: Список остановок
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
 *                     $ref: '#/components/schemas/StopResponse'
 */
router.get(
    '/',
    auth,
    checkRole(['DRIVER']),
    stopController.getDriverStops
);

/**
 * @swagger
 * /api/stops:
 *   post:
 *     tags:
 *       - Stops
 *     summary: Создание новой остановки
 *     description: Создает новую остановку для авторизованного водителя
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
 *               districtId:
 *                 type: integer
 *               address:
 *                 type: string
 *               mapLocation:
 *                 type: string
 *               stopTime:
 *                 type: string
 *                 format: date-time
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Остановка успешно создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StopResponse'
 */
router.post(
    '/',
    auth,
    checkRole(['DRIVER']),
    stop.single('photo'),
    stopValidators.createValidation,
    validate,
    stopController.createStop
);

/**
 * @swagger
 * /api/stops/{id}:
 *   put:
 *     tags:
 *       - Stops
 *     summary: Обновление остановки
 *     description: Обновляет информацию об остановке
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID остановки
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               address:
 *                 type: string
 *               mapLocation:
 *                 type: string
 *               stopTime:
 *                 type: string
 *                 format: date-time
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Остановка успешно обновлена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StopResponse'
 */
router.put(
    '/:id',
    auth,
    checkRole(['DRIVER']),
    stop.single('photo'),
    stopValidators.updateValidation,
    validate,
    stopController.updateStop
);

/**
 * @swagger
 * /api/stops/{id}:
 *   delete:
 *     tags:
 *       - Stops
 *     summary: Удаление остановки
 *     description: Удаляет остановку
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID остановки
 *     responses:
 *       200:
 *         description: Остановка успешно удалена
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
 *                   example: Остановка успешно удалена
 */
router.delete(
    '/:id',
    auth,
    checkRole(['DRIVER']),
    stopController.deleteStop
);

module.exports = router;