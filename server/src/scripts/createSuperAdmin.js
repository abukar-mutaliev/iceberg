const prisma = require('../models');
const bcrypt = require('bcryptjs');

async function createSuperAdmin() {
    const email = 'superadmin@example.com';
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        console.log('Суперадминистратор уже существует');
        return;
    }

    const hashedPassword = await bcrypt.hash('SupPass123', 10);

    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            role: 'ADMIN',
            admin: {
                create: {
                    name: 'Super Admin',
                    isSuperAdmin: true
                }
            }
        },
        include: {
            admin: true
        }
    });

    console.log('Суперадминистратор создан:', user);
}

createSuperAdmin()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
