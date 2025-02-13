const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category/category.controller');
const { auth, checkRole } = require('../middlewares/auth.middleware');
const categoryValidators = require('../validators/category.validator');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Управление категориями
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CategoryCreateRequest:
 *       type: object
 *       required:
 *         - name
 *         - slug
 *       properties:
 *         name:
 *           type: string
 *           description: Название категории
 *         slug:
 *           type: string
 *           description: Уникальный идентификатор категории (slug)
 *         description:
 *           type: string
 *           description: Описание категории
 *     CategoryResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         slug:
 *           type: string
 *         description:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ProductCreateRequest:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - price
 *         - stockQuantity
 *         - categories
 *       properties:
 *         name:
 *           type: string
 *           description: Название продукта
 *         description:
 *           type: string
 *           description: Описание продукта
 *         price:
 *           type: number
 *           format: float
 *           description: Цена продукта
 *         stockQuantity:
 *           type: integer
 *           description: Количество на складе
 *         categories:
 *           type: array
 *           items:
 *             type: integer
 *           description: Список идентификаторов категорий, к которым принадлежит продукт
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Список изображений продукта
 *     ProductResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *           format: float
 *         stockQuantity:
 *           type: integer
 *         categories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CategoryResponse'
 *           description: Категории продукта
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Список изображений продукта
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/categories:
 *   post:
 *     tags:
 *       - Categories
 *     summary: Создание новой категории
 *     description: Создает новую категорию
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryCreateRequest'
 *     responses:
 *       201:
 *         description: Категория успешно создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 */
router.post(
    '/',
    auth,
    checkRole(['ADMIN']),
    categoryValidators.createCategoryValidation,
    categoryController.createCategory
);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     tags:
 *       - Categories
 *     summary: Обновление информации о категории
 *     description: Обновляет информацию о категории
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Категория успешно обновлена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 */
router.put(
    '/:id',
    auth,
    checkRole(['ADMIN']),
    categoryValidators.updateCategoryValidation,
    categoryController.updateCategory
);

/**
 * @swagger
 * /api/categories:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Получение списка всех категорий
 *     description: Возвращает список всех категорий
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     responses:
 *       200:
 *         description: Список категорий
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CategoryResponse'
 */
router.get('/', categoryController.getCategories);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Получение категории по ID
 *     description: Возвращает информацию о категории по её ID
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID категории
 *     responses:
 *       200:
 *         description: Информация о категории
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 *       404:
 *         description: Категория не найдена
 */
router.get(
    '/:id',
    categoryValidators.getCategoryByIdValidation,
    categoryController.getCategoryById
);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     tags:
 *       - Categories
 *     summary: Удаление категории
 *     description: Удаляет категорию по её ID
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID категории
 *     responses:
 *       200:
 *         description: Категория успешно удалена
 *       404:
 *         description: Категория не найдена
 */
router.delete(
    '/:id',
    auth,
    checkRole(['ADMIN']),
    categoryValidators.deleteCategoryValidation,
    categoryController.deleteCategory
);


module.exports = router;
