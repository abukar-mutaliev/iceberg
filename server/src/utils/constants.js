const ALLOWED_FILE_TYPES = (process.env.ALLOWED_FILE_TYPES || 'jpeg,jpg,png,gif,webp').split(',');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10);

module.exports = {
    ALLOWED_FILE_TYPES,
    MAX_FILE_SIZE
};