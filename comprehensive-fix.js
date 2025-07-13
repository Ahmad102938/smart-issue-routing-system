const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function comprehensiveFix() {
    try {
        console.log('🔧 Starting comprehensive fix...\n');

        // Step 1: Check current database state
        console.log('📊 Checking current database state...');

        const stores = await prisma.store.findMany();
        console.log(`Found ${stores.length} stores:`);
        stores.forEach(store => {
            console.log(`  - ID: ${store.id}, Name: ${store.name}, City: ${store.city}`);
        });

        const users = await prisma.user.findMany({
            where: { role: 'STORE_REGISTER' },
            select: {
                id: true,
                username: true,
                email: true,
                associated_store_id: true,
                associated_provider_id: true
            }
        });

        console.log(`\nFound ${users.length} store users:`);
        users.forEach(user => {
            console.log(`  - ${user.username} (${user.email})`);
            console.log(`    Store ID: ${user.associated_store_id || 'NULL'}`);
            console.log(`    Provider ID: ${user.associated_provider_id || 'NULL'}`);
        });

        // Step 2: Fix user associations
        console.log('\n🔧 Fixing user associations...');

        // Fix Ahmad102938's store association
        const ahmadUser = await prisma.user.findUnique({
            where: { username: 'Ahmad102938' }
        });

        if (ahmadUser) {
            if (!ahmadUser.associated_store_id || ahmadUser.associated_store_id === 'cmd0opuro0001wockh4ka9zjc') {
                await prisma.user.update({
                    where: { id: ahmadUser.id },
                    data: {
                        associated_store_id: 'cmd0r7avq0000woisyq4jzz1c' // valid store ID
                    }
                });
                console.log('✅ Fixed Ahmad102938 store association');
            } else {
                console.log('ℹ️  Ahmad102938 already has correct store association');
            }
        }

        // Step 3: Verify all users have valid store associations
        console.log('\n🔍 Verifying all store users have valid associations...');

        const storeUsers = await prisma.user.findMany({
            where: { role: 'STORE_REGISTER' }
        });

        for (const user of storeUsers) {
            if (!user.associated_store_id) {
                console.log(`⚠️  User ${user.username} has no store association`);
                // Assign to first available store
                if (stores.length > 0) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { associated_store_id: stores[0].id }
                    });
                    console.log(`✅ Assigned ${user.username} to store ${stores[0].name}`);
                }
            } else {
                const storeExists = stores.some(store => store.id === user.associated_store_id);
                if (!storeExists) {
                    console.log(`⚠️  User ${user.username} has invalid store ID: ${user.associated_store_id}`);
                    // Assign to first available store
                    if (stores.length > 0) {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { associated_store_id: stores[0].id }
                        });
                        console.log(`✅ Fixed ${user.username} store association`);
                    }
                }
            }
        }

        // Step 4: Final verification
        console.log('\n✅ Final verification...');

        const finalUsers = await prisma.user.findMany({
            where: { role: 'STORE_REGISTER' },
            select: {
                id: true,
                username: true,
                associated_store_id: true
            }
        });

        console.log('Store users after fix:');
        finalUsers.forEach(user => {
            const store = stores.find(s => s.id === user.associated_store_id);
            console.log(`  - ${user.username} → ${store ? store.name : 'INVALID STORE'}`);
        });

        console.log('\n🎉 Comprehensive fix completed!');
        console.log('\n📋 Next steps:');
        console.log('1. Log out of the application');
        console.log('2. Log back in as Ahmad102938');
        console.log('3. Try creating a ticket - it should work now!');

    } catch (error) {
        console.error('❌ Error during comprehensive fix:', error);
    } finally {
        await prisma.$disconnect();
    }
}

comprehensiveFix();