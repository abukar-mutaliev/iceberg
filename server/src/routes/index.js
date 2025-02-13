const express = require('express');
const router = express.Router();

const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerOption = require('../swagger');

const authRoutes = require('./auth.routes');
const twoFactorRoutes = require('./twoFactor.routes');
const adminRouter = require('./admin.routes');
const usersRouter = require('./user.routes');
const profileRoutes = require('./profile.routes');
const clientRoutes = require('./client.routes');
const employeeRoutes = require('./employee.routes');
const supplierRoutes = require('./supplier.routes');
const driverRoutes = require('./driver.routes');
const districtRoutes = require('./district.routes');
const stopRoutes = require('./stop.routes');
const productRoutes = require('./product.routes');
const feedbackRoutes = require('./feedback.routes');
const categoryRoutes = require('./category.routes');
const staffApplicationRouter = require('./staffApplication.routes');

const swaggerDocs = swaggerJsDoc(swaggerOption);

const swaggerOptions = {
    swaggerOptions: {
        persistAuthorization: true,
        withCredentials: true,
        docExpansion: 'none',
        onComplete: function() {
            fetch('/api/csrf-token', {
                credentials: 'include'
            })
                .then(response => response.json())
                .then(data => {
                    const authBox = document.querySelector('.auth-wrapper input[placeholder="x-csrf-token"]');
                    if (authBox) {
                        authBox.value = data.csrfToken;
                    }
                });
        }
    }
};

router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, swaggerOptions));

router.use('/auth', authRoutes);
router.use('/2fa', twoFactorRoutes);
router.use('/admin', adminRouter);
router.use('/users', usersRouter);
router.use('/client', clientRoutes);
router.use('/employee', employeeRoutes);
router.use('/supplier', supplierRoutes);
router.use('/driver', driverRoutes);
router.use('/districts', districtRoutes);
router.use('/stops', stopRoutes);
router.use('/products', productRoutes);
router.use('/feedbacks', feedbackRoutes);
router.use('/categories', categoryRoutes);
router.use('/staff-applications', staffApplicationRouter);
router.use('/profile', profileRoutes);



router.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
    });
});

module.exports = router;
