const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback/feedback.controller');
const { auth } = require('../middlewares/auth.middleware');
const feedbackValidators = require('../validators/feedback.validator');


/**
 * @swagger
 * components:
 *   schemas:
 *     FeedbackCreateRequest:
 *       type: object
 *       required:
 *         - productId
 *         - rating
 *       properties:
 *         productId:
 *           type: integer
 *           description: ID продукта
 *         rating:
 *           type: integer
 *           description: Рейтинг от 1 до 5
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *           description: Текст отзыва (необязательное поле, максимум 500 символов)
 *     FeedbackResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         productId:
 *           type: integer
 *         rating:
 *           type: integer
 *         comment:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/feedbacks:
 *   post:
 *     tags:
 *       - Feedbacks
 *     summary: Создание нового отзыва
 *     description: Добавляет новый отзыв к продукту
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeedbackCreateRequest'
 *     responses:
 *       201:
 *         description: Отзыв успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FeedbackResponse'
 */
router.post(
    '/',
    auth,
    feedbackValidators.createFeedbackValidation,
    feedbackController.createFeedback
);

/**
 * @swagger
 * /api/feedbacks/{id}:
 *   put:
 *     tags:
 *       - Feedbacks
 *     summary: Обновление отзыва
 *     description: Обновляет текст и/или рейтинг отзыва
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID отзыва
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 description: Рейтинг от 1 до 5
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *                 description: Текст отзыва (необязательное поле, максимум 500 символов)
 *     responses:
 *       200:
 *         description: Отзыв успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FeedbackResponse'
 */
router.put(
    '/:id',
    auth,
    feedbackValidators.updateFeedbackValidation,
    feedbackController.updateFeedback
);

/**
 * @swagger
 * /api/feedbacks/{id}:
 *   delete:
 *     tags:
 *       - Feedbacks
 *     summary: Удаление отзыва
 *     description: Удаляет отзыв по его ID
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID отзыва
 *     responses:
 *       200:
 *         description: Отзыв успешно удален
 */
router.delete(
    '/:id',
    auth,
    feedbackValidators.deleteFeedbackValidation,
    feedbackController.deleteFeedback
);

module.exports = router;
