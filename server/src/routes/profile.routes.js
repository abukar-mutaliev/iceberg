const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile/profile.controller');
const { auth, checkRole } = require('../middlewares/auth.middleware');
const { passwordValidation, validateProfileMiddleware, validateProfile, updateAvatarValidator, changePasswordValidator,
    updateProfileValidators
} = require("../validators/profile.validator");
const upload = require("../middlewares/upload.middleware");


const ALLOWED_ROLES = ['ADMIN', 'CLIENT', 'EMPLOYEE', 'SUPPLIER', 'DRIVER'];
const authMiddleware = [auth, checkRole(ALLOWED_ROLES)];


/**
 * @swagger
 * /api/profile:
 *   get:
 *     tags:
 *       - ProfileScreen
 *     summary: Получение профиля пользователя
 *     description: Возвращает информацию о профиле авторизованного пользователя в зависимости от его роли
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     responses:
 *       200:
 *         description: Успешное получение профиля
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/SupplierProfileResponse'
 *                 - $ref: '#/components/schemas/DriverProfileResponse'
 *                 - $ref: '#/components/schemas/ClientProfileResponse'
 *                 - $ref: '#/components/schemas/EmployeeProfileResponse'
 *                 - $ref: '#/components/schemas/AdminProfileResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/',
    authMiddleware,
    profileController.getProfile
);

/**
 * @swagger
 * /api/profile/avatar:
 *   post:
 *     tags:
 *       - ProfileScreen
 *     summary: Загрузка аватара пользователя
 *     description: Загружает новый аватар для профиля пользователя
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
 *         description: Аватар успешно загружен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Аватар успешно обновлен"
 *                 data:
 *                   type: object
 *                   properties:
 *                     avatar:
 *                       type: string
 *                       description: URL загруженного аватара
 *                       example: "http://example.com/uploads/avatar.jpg"
 *       400:
 *         description: Ошибка при загрузке файла
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Неверный формат файла"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/avatar',
    [...authMiddleware, upload.avatar.single('avatar'), updateAvatarValidator],
    profileController.updateAvatar
);

/**
 * @swagger
 * /api/profile/password:
 *   put:
 *     tags:
 *       - ProfileScreen
 *     summary: Изменение пароля пользователя
 *     description: Изменяет пароль авторизованного пользователя
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Текущий пароль пользователя
 *                 example: "current123"
 *               newPassword:
 *                 type: string
 *                 description: Новый пароль пользователя
 *                 example: "new123456"
 *     responses:
 *       200:
 *         description: Пароль успешно изменен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Пароль успешно изменен"
 *       400:
 *         description: Ошибка валидации или неверный текущий пароль
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Неверный текущий пароль"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put('/password',
    [...authMiddleware, changePasswordValidator],
    profileController.changePassword
);

/**
 * @swagger
 * /api/profile:
 *   put:
 *     tags:
 *       - ProfileScreen
 *     summary: Обновление профиля пользователя
 *     description: Обновляет информацию профиля авторизованного пользователя в зависимости от его роли
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/SupplierProfileUpdateRequest'
 *               - $ref: '#/components/schemas/DriverProfileUpdateRequest'
 *               - $ref: '#/components/schemas/ClientProfileUpdateRequest'
 *               - $ref: '#/components/schemas/EmployeeProfileUpdateRequest'
 *               - $ref: '#/components/schemas/AdminProfileUpdateRequest'
 *     responses:
 *       200:
 *         description: Профиль успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/SupplierProfileResponse'
 *                 - $ref: '#/components/schemas/DriverProfileResponse'
 *                 - $ref: '#/components/schemas/ClientProfileResponse'
 *                 - $ref: '#/components/schemas/EmployeeProfileResponse'
 *                 - $ref: '#/components/schemas/AdminProfileResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *
 * components:
 *   schemas:
 *     BaseProfileUpdateRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Имя пользователя
 *           example: "Иван Иванов"
 *         phone:
 *           type: string
 *           description: Номер телефона
 *           example: "+79001234567"
 *         address:
 *           type: string
 *           description: Адрес
 *           example: "ул. Пушкина, д. 10"
 *
 *     SupplierProfileUpdateRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseProfileUpdateRequest'
 *         - type: object
 *           properties:
 *             companyName:
 *               type: string
 *               description: Название компании
 *               example: "ООО Ромашка"
 *             contactPerson:
 *               type: string
 *               description: Контактное лицо
 *               example: "Петр Петров"
 *             inn:
 *               type: string
 *               description: ИНН организации
 *               example: "7712345678"
 *             ogrn:
 *               type: string
 *               description: ОГРН организации
 *               example: "1234567890123"
 *             bankAccount:
 *               type: string
 *               description: Расчетный счет
 *               example: "40702810123456789012"
 *             bik:
 *               type: string
 *               description: БИК банка
 *               example: "044525225"
 *
 *     DriverProfileUpdateRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseProfileUpdateRequest'
 *         - type: object
 *           properties:
 *             districts:
 *               type: array
 *               description: ID районов обслуживания
 *               items:
 *                 type: integer
 *               example: [1, 2, 3]
 *
 *     ClientProfileUpdateRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseProfileUpdateRequest'
 *         - type: object
 *           properties:
 *             districtId:
 *               type: integer
 *               description: ID района проживания
 *               example: 1
 *
 *     EmployeeProfileUpdateRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseProfileUpdateRequest'
 *         - type: object
 *           properties:
 *             position:
 *               type: string
 *               description: Должность сотрудника
 *               example: "Менеджер"
 *
 *     AdminProfileUpdateRequest:
 *       $ref: '#/components/schemas/BaseProfileUpdateRequest'
 *
 *     BaseProfileResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: "success"
 *         message:
 *           type: string
 *           example: "Профиль успешно обновлен"
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             phone:
 *               type: string
 *             address:
 *               type: string
 *             user:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 avatar:
 *                   type: string
 *
 *     SupplierProfileResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseProfileResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 companyName:
 *                   type: string
 *                 contactPerson:
 *                   type: string
 *                 inn:
 *                   type: string
 *                 ogrn:
 *                   type: string
 *                 bankAccount:
 *                   type: string
 *                 bik:
 *                   type: string
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 supplies:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Supply'
 *
 *     DriverProfileResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseProfileResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 districts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/District'
 *                 stops:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Stop'
 *
 *     ClientProfileResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseProfileResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 district:
 *                   $ref: '#/components/schemas/District'
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 preferences:
 *                   $ref: '#/components/schemas/UserPreference'
 *
 *     EmployeeProfileResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseProfileResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 position:
 *                   type: string
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 workTimes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WorkTime'
 */
router.put('/',
    [...authMiddleware, updateProfileValidators],
    profileController.updateProfile
);

module.exports = router;