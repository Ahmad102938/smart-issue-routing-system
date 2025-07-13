const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPendingProviders() {
    try {
        console.log('Checking for pending service providers...\n');

        // Check all service provider users
        const allServiceProviders = await prisma.user.findMany({
            where: {
                role: 'SERVICE_PROVIDER'
            },
            include: {
                service_provider: true
            }
        });

        console.log(`Total service provider users: ${allServiceProviders.length}`);

        allServiceProviders.forEach(user => {
            console.log(`\nUser: ${user.username} (${user.email})`);
            console.log(`  Registration Status: ${user.registration_status}`);
            console.log(`  Is Active: ${user.is_active}`);
            if (user.service_provider) {
                console.log(`  Service Provider Status: ${user.service_provider.status}`);
                console.log(`  Company: ${user.service_provider.company_name}`);
                console.log(`  Created: ${user.created_at}`);
            } else {
                console.log(`  No service provider record found`);
            }
        });

        // Check specifically for pending ones
        const pendingProviders = await prisma.user.findMany({
            where: {
                role: 'SERVICE_PROVIDER',
                registration_status: 'PENDING',
                service_provider: {
                    status: 'PENDING_APPROVAL'
                }
            },
            include: {
                service_provider: true
            }
        });

        console.log(`\n\nPending service providers: ${pendingProviders.length}`);
        pendingProviders.forEach(provider => {
            console.log(`- ${provider.username} (${provider.email})`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPendingProviders();