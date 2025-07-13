const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkStores() {
    try {
        const stores = await prisma.store.findMany();
        console.log('Available stores:');
        stores.forEach(store => {
            console.log(`- ID: ${store.id}, Name: ${store.name}, City: ${store.city}`);
        });

        const users = await prisma.user.findMany({
            where: { role: 'STORE_REGISTER' },
            select: { id: true, username: true, email: true, associated_store_id: true }
        });

        console.log('\nStore users:');
        users.forEach(user => {
            console.log(`- ID: ${user.id}, Username: ${user.username}, Store ID: ${user.associated_store_id}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkStores();