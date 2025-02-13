const { body } = require('express-validator');

const staffApplicationValidators = {
    applyForStaffValidation: [
        body('desiredRole')
            .isIn(['EMPLOYEE', 'SUPPLIER', 'DRIVER'])
            .withMessage('Некорректная роль'),
        body('districts')
            .optional()
            .custom((value) => {
                if (!value) return true;
                const districts = Array.isArray(value) ? value : [value];
                return districts.every(id => Number.isInteger(Number(id)) && Number(id) > 0);
            })
            .withMessage('ID районов должны быть положительными числами')
    ]
};

module.exports = staffApplicationValidators;