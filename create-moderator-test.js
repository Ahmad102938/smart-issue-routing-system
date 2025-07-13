const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestModerator() {
    try {
        // Create a test moderator user
        const hashedPassword = await bcrypt.hash('password123', 10);

        const moderator = await prisma.user.create({
            data: {
                username: 'testmoderator',
                email: 'moderator@test.com',
                password_hash: hashedPassword,
                role: 'MODERATOR',
                is_active: true,
                registration_status: 'APPROVED'
            }
        });

        console.log('Created moderator:', moderator);

        // Create a test store and assign the moderator
        const store = await prisma.store.create({
            data: {
                name: 'Test Walmart Store',
                store_id: 'WM001',
                address: '123 Main Street',
                city: 'Test City',
                state: 'TX',
                zip_code: '12345',
                phone: '555-123-4567',
                manager_name: 'John Manager',
                moderator_user_id: moderator.id,
                status: 'ACTIVE'
            }
        });

        console.log('Created store and assigned moderator:', store);

        console.log('\nTest moderator credentials:');
        console.log('Username: testmoderator');
        console.log('Password: password123');
        console.log('Role: MODERATOR');
        console.log('Store: WM001');

    } catch (error) {
        console.error('Error creating test moderator:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestModerator();