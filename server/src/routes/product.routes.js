const express = require('express');
const router = express.Router();
const productController = require('../controllers/product/product.controller');
const { auth, checkRole } = require('../middlewares/auth.middleware');
const productValidators = require('../validators/product.validator');
const upload = require('../middlewares/upload.middleware');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Управление продуктами
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductCreateRequest:
 *       type: object
 *       required:
 *         - supplierId
 *         - name
 *         - price
 *         - stockQuantity
 *       properties:
 *         supplierId:
 *           type: integer
 *           description: ID поставщика
 *         name:
 *           type: string
 *           description: Название продукта
 *         description:
 *           type: string
 *           description: Описание продукта
 *         price:
 *           type: number
 *           description: Цена продукта
 *         stockQuantity:
 *           type: integer
 *           description: Количество на складе
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *           description: Категории продукта
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
 *         stockQuantity:
 *           type: integer
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Массив путей к изображениям
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *         isActive:
 *           type: boolean
 */
/**
 * @swagger
 * /api/products:
 *   post:
 *     tags:
 *       - Products
 *     summary: Создание нового продукта
 *     description: |
 *       Создает новый продукт в системе с возможностью загрузки изображений.
 *       Для ADMIN и EMPLOYEE - необходимо указать supplierId существующего поставщика.
 *       Для SUPPLIER - продукт автоматически привязывается к их аккаунту.
 *     security:
 *       - bearerAuth: []
 *       - csrfAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - stockQuantity
 *             properties:
 *               supplierId:
 *                 type: integer
 *                 description: |
 *                   ID поставщика:
 *                   - Обязательно для ADMIN/EMPLOYEE
 *                   - Не используется для SUPPLIER (система автоматически использует их ID)
 *                 example: 1
 *               name:
 *                 type: string
 *                 description: Название продукта
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Рожок"
 *               description:
 *                 type: string
 *                 description: Описание продукта
 *                 maxLength: 1000
 *                 example: "Мороженое Рожок с глазурью и кусочками миндаля 200 мл"
 *               price:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Цена продукта
 *                 example: 89.90
 *               stockQuantity:
 *                 type: integer
 *                 minimum: 0
 *                 description: Количество на складе
 *                 example: 100
 *               categories:
 *                 type: string
 *                 description: |
 *                   ID категорий в одном из форматов:
 *                   - JSON массив "[1,2,3]"
 *                   - строка с запятыми "1,2,3"
 *                   - одиночное значение "1"
 *                   Все указанные категории должны существовать в системе.
 *                 example: "[1,2]"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Изображения продукта (максимум 10 файлов)
 *     responses:
 *       201:
 *         description: Продукт успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/ProductResponse'
 *                 message:
 *                   type: string
 *                   example: Продукт успешно создан
 *       400:
 *         description: Ошибка валидации или некорректные данные
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
 *                   example: Ошибка валидации
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: supplierId
 *                       message:
 *                         type: string
 *                         example: Необходимо выбрать поставщика
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post(
    '/',
    auth,
    checkRole(['ADMIN', 'EMPLOYEE', 'SUPPLIER']),
    upload.products.array('images', 10),
    productValidators.createProductValidation,
    productController.createProduct
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     tags:
 *       - Products
 *     summary: Обновление информации о продукте
 *     description: Обновляет информацию о продукте, включая изображения и категории. Поддерживает частичное обновление.
 *     security:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *     csrfAuth:
 *       type: apiKey
 *       in: header
 *       name: X-CSRF-Token
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID продукта для обновления
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               supplierId:
 *                 type: integer
 *                 description: ID поставщика
 *               name:
 *                 type: string
 *                 description: Название продукта
 *                 minLength: 2
 *               description:
 *                 type: string
 *                 description: Описание продукта
 *               price:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Цена продукта
 *               stockQuantity:
 *                 type: integer
 *                 minimum: 0
 *                 description: Количество на складе
 *               categories:
 *                 type: string
 *                 description: |
 *                   ID категорий в одном из форматов:
 *                   - JSON массив "[1,2,3]"
 *                   - строка с запятыми "1,2,3"
 *                   - одиночное значение "1"
 *                   Пустой массив "[]" удалит все категории
 *                 example: "[1,2,3]"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Новые изображения для добавления (максимум 10 файлов)
 *               removeImages:
 *                 type: string
 *                 description: JSON массив с путями изображений для удаления
 *                 example: '["products/image1.jpg"]'
 *     responses:
 *       200:
 *         description: Продукт успешно обновлен
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
 *                     product:
 *                       $ref: '#/components/schemas/ProductResponse'
 *                 message:
 *                   type: string
 *                   example: Продукт успешно обновлен
 *       400:
 *         description: Ошибка валидации или неверный формат данных
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
    '/:id',
    auth,
    checkRole(['ADMIN', 'EMPLOYEE', 'SUPPLIER']),
    upload.products.array('images', 10),
    productValidators.updateProductValidation,
    productController.updateProduct
);

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags:
 *       - Products
 *     summary: Получение списка всех продуктов
 *     description: Возвращает список всех продуктов с информацией о поставщиках
 *     security:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *     csrfAuth:
 *       type: apiKey
 *       in: header
 *       name: X-CSRF-Token
 *     responses:
 *       200:
 *         description: Список продуктов
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductsListResponse'
 */
router.get('/', productController.getProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Получение продукта по ID
 *     description: Возвращает информацию о продукте по его ID
 *     security:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *     csrfAuth:
 *       type: apiKey
 *       in: header
 *       name: X-CSRF-Token
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID продукта
 *     responses:
 *       200:
 *         description: Информация о продукте
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', productValidators.getProductByIdValidation, productController.getProductById);


/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     tags:
 *       - Products
 *     summary: Удаление продукта
 *     description: Удаляет продукт по его ID
 *     security:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *     csrfAuth:
 *       type: apiKey
 *       in: header
 *       name: X-CSRF-Token
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID продукта
 *     responses:
 *       200:
 *         description: Продукт успешно удален
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
    '/:id',
    auth,
    checkRole(['ADMIN', 'EMPLOYEE', 'SUPPLIER']),
    productValidators.deleteProductValidation,
    productController.deleteProduct
);

module.exports = router;
