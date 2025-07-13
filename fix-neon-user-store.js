const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixNeonUserStoreAssociations() {
    try {
        console.log('🔧 Fixing user-store associations in NeonDB...');

        // Get all stores
        const stores = await prisma.store.findMany({
            select: { id: true, name: true, city: true }
        });

        console.log(`Found ${stores.length} stores:`);
        stores.forEach(store => {
            console.log(`  - ID: ${store.id}, Name: ${store.name}, City: ${store.city}`);
        });

        // Get all users with STORE_REGISTER role
        const storeUsers = await prisma.user.findMany({
            where: { role: 'STORE_REGISTER' },
            select: {
                id: true,
                username: true,
                email: true,
                associated_store_id: true
            }
        });

        console.log(`\nFound ${storeUsers.length} store register users:`);
        storeUsers.forEach(user => {
            console.log(`  - ${user.username} (${user.email})`);
            console.log(`    Current store ID: ${user.associated_store_id || 'NULL'}`);
        });

        // Fix associations
        console.log('\n🔧 Fixing associations...');

        for (const user of storeUsers) {
            if (!user.associated_store_id) {
                // Assign to the first available store
                const storeToAssign = stores[0];
                if (storeToAssign) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { associated_store_id: storeToAssign.id }
                    });
                    console.log(`✅ Associated ${user.username} with store: ${storeToAssign.name}`);
                }
            }
        }

        // Verify the fix
        console.log('\n🔍 Verifying associations...');
        const updatedUsers = await prisma.user.findMany({
            where: { role: 'STORE_REGISTER' },
            select: {
                id: true,
                username: true,
                email: true,
                associated_store_id: true
            }
        });

        console.log('\n✅ Final user associations:');
        updatedUsers.forEach(user => {
            const store = stores.find(s => s.id === user.associated_store_id);
            console.log(`  - ${user.username} → ${store ? store.name : 'NO STORE'}`);
        });

        console.log('\n🎉 NeonDB user-store associations fixed!');
        console.log('\n📋 Next steps:');
        console.log('1. Log out of the application');
        console.log('2. Log back in to refresh your session');
        console.log('3. Try creating a ticket - it should work now!');

    } catch (error) {
        console.error('❌ Error fixing associations:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixNeonUserStoreAssociations();