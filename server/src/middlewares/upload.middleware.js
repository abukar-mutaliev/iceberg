const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/errors/ApiError');
const { logError } = require("../utils/logger");
const fs = require('fs/promises');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Только изображения'), false);
    }

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExt = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(fileExt)) {
        return cb(new Error('Неподдерживаемый формат файла'), false);
    }

    cb(null, true);
};

const createMulterUpload = (options = {}) => {
    return multer({
        storage,
        fileFilter,
        limits: {
            fileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024,
            ...options.limits
        }
    });
};

const upload = {
    products: createMulterUpload({
        limits: {
            files: 10
        }
    }),

    avatar: createMulterUpload({
        limits: {
            files: 1
        }
    }),

    stop: createMulterUpload({
        limits: {
            files: 1,
            fileSize: 10 * 1024 * 1024
        }
    }),
    async processAvatar(file) {
        try {
            const sharp = require('sharp');
            const processedBuffer = await sharp(file.buffer)
                .resize(300, 300, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({ quality: 85 })
                .toBuffer();

            return {
                ...file,
                buffer: processedBuffer,
                mimetype: 'image/jpeg',
                originalname: file.originalname.replace(/\.[^/.]+$/, '.jpg')
            };
        } catch (error) {
            logError('Ошибка при обработке аватара:', {
                error: error.message,
                fileName: file.originalname
            });
            throw ApiError.internal('Ошибка при обработке аватара');
        }
    },

    async processProductImage(file) {
        try {
            const sharp = require('sharp');
            const processedBuffer = await sharp(file.buffer)
                .resize(800, 800, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality: 80 })
                .toBuffer();

            return {
                ...file,
                buffer: processedBuffer,
                mimetype: 'image/jpeg',
                originalname: file.originalname.replace(/\.[^/.]+$/, '.jpg')
            };
        } catch (error) {
            logError('Ошибка при обработке изображения товара:', {
                error: error.message,
                fileName: file.originalname
            });
            throw ApiError.internal('Ошибка при обработке изображения');
        }
    },

    async processStopPhoto(file) {
        try {
            const sharp = require('sharp');
            const processedBuffer = await sharp(file.buffer)
                .resize(1200, 1200, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality: 80 })
                .toBuffer();

            return {
                ...file,
                buffer: processedBuffer,
                mimetype: 'image/jpeg',
                originalname: file.originalname.replace(/\.[^/.]+$/, '.jpg')
            };
        } catch (error) {
            logError('Ошибка при обработке фото остановки:', {
                error: error.message,
                fileName: file.originalname
            });
            throw ApiError.internal('Ошибка при обработке фотографии');
        }
    },

    async saveFile(file, directory) {
        try {
            const uploadPath = path.join(process.env.UPLOAD_DIR || 'uploads', directory);
            await fs.mkdir(uploadPath, { recursive: true });

            let processedFile = file;

            switch (directory) {
                case 'stops':
                    processedFile = await this.processStopPhoto(file);
                    break;
                case 'avatars':
                    processedFile = await this.processAvatar(file);
                    break;
                case 'products':
                    processedFile = await this.processProductImage(file);
                    break;
            }

            const uniqueName = `${Date.now()}-${processedFile.originalname}`;
            const filePath = path.join(directory, uniqueName);
            const fullPath = path.join(process.env.UPLOAD_DIR || 'uploads', filePath);

            await fs.writeFile(fullPath, processedFile.buffer);

            if (directory === 'stops' && processedFile.mapLocation) {
                try {
                    const exiftool = require('node-exiftool');
                    const ep = new exiftool.ExiftoolProcess();
                    await ep.open();
                    await ep.writeMetadata(fullPath, {
                        'GPSLatitude': processedFile.mapLocation.split(',')[0],
                        'GPSLongitude': processedFile.mapLocation.split(',')[1],
                        'Keywords': ['ice_cream_stop', 'driver_photo'],
                        'ImageDescription': `Driver stop at ${processedFile.address || 'unknown location'}`
                    }, ['overwrite_original']);
                    await ep.close();
                } catch (exifError) {
                    logError('Ошибка при записи EXIF данных:', {
                        error: exifError.message,
                        filePath
                    });
                }
            }

            return filePath;
        } catch (error) {
            logError('Ошибка при сохранении файла:', {
                error: error.message,
                fileName: file.originalname,
                directory
            });
            throw ApiError.internal('Ошибка при сохранении файла');
        }
    },

    async deleteFile(filePath) {
        try {
            if (filePath) {
                const fullPath = path.join(process.env.UPLOAD_DIR || 'uploads', filePath);
                await fs.unlink(fullPath);
            }
        } catch (error) {
            logError('Ошибка при удалении файла:', {
                error: error.message,
                filePath
            });
        }
    }
};

module.exports = upload;