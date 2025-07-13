const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.user.update({
        where: { id: 'cmd0opvpv0003wocku0ldm1x1' }, // Ahmad102938's user ID
        data: { associated_store_id: 'cmd0r7avq0000woisyq4jzz1c' } // valid store ID
    });
    console.log('User store association fixed!');
    await prisma.$disconnect();
}

main();