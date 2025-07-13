const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
    try {
        console.log('Testing database connection...');

        // Test basic connection
        await prisma.$connect();
        console.log('✅ Database connected successfully!');

        // Test a simple query
        const userCount = await prisma.user.count();
        console.log(`✅ User count: ${userCount}`);

        // Test creating a test user
        const testUser = await prisma.user.create({
            data: {
                username: 'test_user',
                email: 'test@example.com',
                password_hash: 'test_hash',
                role: 'ADMIN',
                is_active: true,
                registration_status: 'APPROVED'
            }
        });
        console.log('✅ Test user created:', testUser.username);

        // Clean up
        await prisma.user.delete({
            where: { id: testUser.id }
        });
        console.log('✅ Test user cleaned up');

    } catch (error) {
        console.error('❌ Database test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testDatabase();