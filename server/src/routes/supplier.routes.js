const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile/profile.controller');
const { auth, checkRole } = require('../middlewares/auth.middleware');
const { supplierValidators } = require('../validators/supplier.validator');
const {avatar} = require("../middlewares/upload.middleware");
const validate = require("../middlewares/validate.middleware");

/**
 * @swagger
 * tags:
 *   name: Supplier
 *   description: Управление профилем поставщиков
 */

/**
 * @swagger
 * /api/supplier/profile:
 *   get:
 *     tags:
 *       - Supplier
 *     summary: Получение профиля поставщика
 *     description: Получает информацию о профиле авторизованного поставщика
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     responses:
 *       200:
 *         description: Профиль поставщика
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupplierProfileResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
    '/profile',
    auth,
    checkRole(['SUPPLIER']),
    profileController.getProfile
);

/**
 * @swagger
 * /api/supplier/profile:
 *   put:
 *     tags:
 *       - Supplier
 *     summary: Обновление профиля поставщика
 *     description: Обновляет информацию профиля авторизованного поставщика
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SupplierProfileUpdateRequest'
 *     responses:
 *       200:
 *         description: Профиль успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupplierProfileResponse'
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
    checkRole(['SUPPLIER']),
    supplierValidators.updateProfileValidation,
    profileController.updateProfile
);


/**
 * @swagger
 * /api/supplier/profile/avatar:
 *   post:
 *     tags:
 *       - Supplier
 *     summary: Загрузка аватара поставщика
 *     description: Загружает новый аватар для профиля поставщика
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
    checkRole(['SUPPLIER']),
    avatar.single('avatar'),
    validate,
    profileController.updateAvatar
);
module.exports = router;
