const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

    if (!process.env.DATABASE_URL) {
        console.error('\n❌ DATABASE_URL environment variable is not set!');
        console.log('\nTo fix this, create a .env.local file in your project root with:');
        console.log('DATABASE_URL="your-neon-database-connection-string"');
        console.log('\nExample:');
        console.log('DATABASE_URL="postgresql://username:password@ep-twilight-hat-a8xuxumf-pooler.eastus2.azure.neon.tech:5432/database?sslmode=require"');
        console.log('\nYou can get your connection string from:');
        console.log('1. Go to https://console.neon.tech');
        console.log('2. Select your project');
        console.log('3. Click on "Connection Details"');
        console.log('4. Copy the connection string');
        return;
    }

    const prisma = new PrismaClient();

    try {
        console.log('\n🔌 Attempting to connect to database...');

        // Test basic connection
        await prisma.$connect();
        console.log('✅ Database connection successful!');

        // Test a simple query
        const userCount = await prisma.user.count();
        console.log(`📊 Found ${userCount} users in database`);

        const ticketCount = await prisma.ticket.count();
        console.log(`📋 Found ${ticketCount} tickets in database`);

        const storeCount = await prisma.store.count();
        console.log(`🏪 Found ${storeCount} stores in database`);

        console.log('\n🎉 Database is working correctly!');

    } catch (error) {
        console.error('\n❌ Database connection failed:');
        console.error(error.message);

        if (error.code === 'P1001') {
            console.log('\n💡 This usually means:');
            console.log('1. The database URL is incorrect');
            console.log('2. The database server is down');
            console.log('3. Network connectivity issues');
            console.log('4. Firewall blocking the connection');
        }

    } finally {
        await prisma.$disconnect();
    }
}

testDatabaseConnection();