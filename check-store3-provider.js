const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkStore3Provider() {
    try {
        console.log('Checking for store3 service provider...\n');

        // Check for user with username containing 'store3'
        const store3User = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: { contains: 'store3' } },
                    { email: { contains: 'store3' } }
                ]
            },
            include: {
                service_provider: true
            }
        });

        if (store3User) {
            console.log('Found store3 user:');
            console.log(`  ID: ${store3User.id}`);
            console.log(`  Username: ${store3User.username}`);
            console.log(`  Email: ${store3User.email}`);
            console.log(`  Role: ${store3User.role}`);
            console.log(`  Registration Status: ${store3User.registration_status}`);
            console.log(`  Is Active: ${store3User.is_active}`);
            console.log(`  Associated Provider ID: ${store3User.associated_provider_id}`);

            if (store3User.service_provider) {
                console.log(`  Service Provider Status: ${store3User.service_provider.status}`);
                console.log(`  Company Name: ${store3User.service_provider.company_name}`);
                console.log(`  Company ID: ${store3User.service_provider.unique_company_id}`);
                console.log(`  Created: ${store3User.service_provider.created_at}`);
                console.log(`  Approved At: ${store3User.service_provider.approved_at}`);
                console.log(`  Approved By: ${store3User.service_provider.approved_by_moderator_id}`);
            } else {
                console.log(`  No service provider record found`);
            }
        } else {
            console.log('No user found with store3 in username or email');
        }

        // Check all pending service providers
        console.log('\n\nAll pending service providers:');
        const allPendingProviders = await prisma.user.findMany({
            where: {
                role: 'SERVICE_PROVIDER',
                registration_status: 'PENDING'
            },
            include: {
                service_provider: true
            }
        });

        console.log(`Total pending service providers: ${allPendingProviders.length}`);
        allPendingProviders.forEach(provider => {
            console.log(`\n- ${provider.username} (${provider.email})`);
            console.log(`  Registration Status: ${provider.registration_status}`);
            console.log(`  Provider Status: ${provider.service_provider?.status || 'No provider record'}`);
            console.log(`  Company: ${provider.service_provider?.company_name || 'N/A'}`);
        });

        // Check all service providers with PENDING_APPROVAL status
        console.log('\n\nAll service providers with PENDING_APPROVAL status:');
        const pendingApprovalProviders = await prisma.serviceProvider.findMany({
            where: {
                status: 'PENDING_APPROVAL'
            },
            include: {
                users: true
            }
        });

        console.log(`Total service providers with PENDING_APPROVAL: ${pendingApprovalProviders.length}`);
        pendingApprovalProviders.forEach(provider => {
            console.log(`\n- Company: ${provider.company_name} (${provider.unique_company_id})`);
            console.log(`  Status: ${provider.status}`);
            console.log(`  Users: ${provider.users.length}`);
            provider.users.forEach(user => {
                console.log(`    - ${user.username} (${user.email}) - ${user.registration_status}`);
            });
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkStore3Provider();