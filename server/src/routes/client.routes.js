const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile/profile.controller');
const { auth, checkRole } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Client
 *   description: Маршруты для управления профилем клиента
 */

/**
 * @swagger
 * /api/client/profile:
 *   get:
 *     tags:
 *       - Client
 *     summary: Получение профиля клиента
 *     description: Получает информацию о профиле авторизованного клиента
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     responses:
 *       200:
 *         description: Профиль клиента
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfileResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
    '/profile',
    auth,
    checkRole(['CLIENT']),
    profileController.getProfile
);

module.exports = router;
