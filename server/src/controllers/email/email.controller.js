const nodemailer = require('nodemailer');
const ApiError = require('../../utils/errors/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const jwt = require('jsonwebtoken');
const prisma = require('../../models');
const {logError, logInfo} = require("../../utils/logger");


let transporter = null;


const getTransporter = async () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            secure: true
        });

        try {
            await transporter.verify();
        } catch (error) {
            logError('Ошибка подключения к почтовому серверу:', error);
            throw new Error('Failed to initialize email transport');
        }
    }
    return transporter;
};

const sendEmail = async (to, subject, text, html) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html
        };

        const transport = await getTransporter();
        await transport.sendMail(mailOptions);
        logInfo('Email отправлен на:', to);
    } catch (error) {
        logError('Ошибка отправки email:', error);
        throw ApiError.internal('Ошибка отправки письма');
    }
};

process.on('SIGTERM', () => {
    if (transporter) {
        transporter.close();
    }
});

const sendVerificationCode = async (userEmail, code) => {
    const html = `
        <h2>Подтверждение регистрации в приложении Iceberg</h2>
        <p>Ваш код подтверждения:</p>
        <h1>${code}</h1>
        <p>Код действителен в течение 15 минут</p>
    `;
    const text = `Ваш код подтверждения: ${code}`;

    try {
        await sendEmail(userEmail, 'Подтверждение регистрации', text, html);
    } catch (error) {
        logError('Ошибка отправки кода подтверждения:', {
            error: error.message,
            userEmail
        });
        throw new Error('Ошибка отправки кода подтверждения');
    }
};



const deactivate2FAByEmail = asyncHandler(async (req, res) => {
    const { token } = req.query;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        const now = Date.now();

        if (decoded.exp * 1000 < now) {
            throw ApiError.unauthorized('Срок действия ссылки истек');
        }

        if (!userId) {
            throw ApiError.unauthorized('Недействительный токен');
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw ApiError.notFound('Пользователь не найден');
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null
            }
        });

        logInfo('2FA отключен по email', { userId });

        res.json({
            status: 'success',
            message: '2FA успешно отключен'
        });
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw ApiError.unauthorized('Недействительный или истекший токен');
        }
        throw error;
    }
});

const sendDeactivationEmail = async (userEmail, token) => {
    const deactivationLink = `${process.env.BASE_URL}/api/2fa/deactivate?token=${token}`;
    const text = `Для отключения 2FA перейдите по ссылке: ${deactivationLink}`;
    const html = `
        <h2>Отключение двухфакторной аутентификации</h2>
        <p>Для отключения 2FA перейдите по ссылке:</p>
        <a href="${deactivationLink}">${deactivationLink}</a>
        <p>Ссылка действительна 1 час</p>
    `;

    try {
        await sendEmail(userEmail, '2FA Deactivation', text, html);
    } catch (error) {
        logError('Ошибка отправки письма деактивации 2FA:', {
            error: error.message,
            userEmail
        });
        throw new Error('Ошибка отправки письма деактивации');
    }
};

const resendVerificationCode = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const registrationToken = jwt.sign(
        {
            email,
            verificationCode,
            type: 'registration'
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

    try {
        await sendVerificationCode(email, verificationCode);

        res.json({
            status: 'success',
            message: 'Новый код подтверждения отправлен',
            registrationToken
        });
    } catch (error) {
        logError('Ошибка повторной отправки кода:', {
            error: error.message,
            email
        });
        throw ApiError.internal('Ошибка отправки кода подтверждения');
    }
});

module.exports = {
    sendEmail,
    sendDeactivationEmail,
    deactivate2FAByEmail,
    resendVerificationCode,
    sendVerificationCode
};