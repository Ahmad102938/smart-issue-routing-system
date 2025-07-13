const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllProviders() {
    try {
        console.log('=== COMPREHENSIVE SERVICE PROVIDER CHECK ===\n');

        // Get ALL users with SERVICE_PROVIDER role
        const allServiceProviderUsers = await prisma.user.findMany({
            where: {
                role: 'SERVICE_PROVIDER'
            },
            include: {
                service_provider: true,
                documents: true
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        console.log(`Total service provider users: ${allServiceProviderUsers.length}\n`);

        allServiceProviderUsers.forEach((user, index) => {
            console.log(`${index + 1}. User: ${user.username} (${user.email})`);
            console.log(`   ID: ${user.id}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Registration Status: ${user.registration_status}`);
            console.log(`   Is Active: ${user.is_active}`);
            console.log(`   Created: ${user.created_at}`);
            console.log(`   Associated Provider ID: ${user.associated_provider_id}`);

            if (user.service_provider) {
                console.log(`   Service Provider Details:`);
                console.log(`     - Company: ${user.service_provider.company_name}`);
                console.log(`     - Company ID: ${user.service_provider.unique_company_id}`);
                console.log(`     - Status: ${user.service_provider.status}`);
                console.log(`     - Created: ${user.service_provider.created_at}`);
                console.log(`     - Approved At: ${user.service_provider.approved_at || 'Not approved'}`);
                console.log(`     - Approved By: ${user.service_provider.approved_by_moderator_id || 'Not approved by moderator'}`);
                console.log(`     - Skills: ${user.service_provider.skills?.join(', ') || 'None'}`);
                console.log(`     - Capacity: ${user.service_provider.capacity_per_day} tickets/day`);
            } else {
                console.log(`   ❌ No service provider record found!`);
            }

            console.log(`   Documents: ${user.documents.length} uploaded`);
            console.log('');
        });

        // Check what the moderator API would return
        console.log('=== MODERATOR API QUERY RESULTS ===\n');

        const moderatorQuery = await prisma.user.findMany({
            where: {
                role: 'SERVICE_PROVIDER',
                registration_status: 'PENDING',
                service_provider: {
                    status: 'PENDING_APPROVAL'
                }
            },
            include: {
                service_provider: true,
                documents: true
            }
        });

        console.log(`Moderator API would return ${moderatorQuery.length} pending providers:`);
        moderatorQuery.forEach(provider => {
            console.log(`- ${provider.username} (${provider.email})`);
        });

        // Check what the admin API would return
        console.log('\n=== ADMIN API QUERY RESULTS ===\n');

        const adminQuery = await prisma.user.findMany({
            where: {
                role: 'SERVICE_PROVIDER'
            },
            include: {
                service_provider: true,
                documents: true
            }
        });

        console.log(`Admin API would return ${adminQuery.length} service providers:`);
        adminQuery.forEach(provider => {
            console.log(`- ${provider.username} (${provider.email}) - ${provider.registration_status} / ${provider.service_provider?.status || 'No provider record'}`);
        });

        // Check for any users with 'store3' in their data
        console.log('\n=== SEARCHING FOR "store3" ===\n');

        const store3Search = await prisma.user.findMany({
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

        if (store3Search.length > 0) {
            console.log(`Found ${store3Search.length} users with 'store3' in their data:`);
            store3Search.forEach(user => {
                console.log(`- ${user.username} (${user.email}) - Role: ${user.role}`);
            });
        } else {
            console.log('No users found with "store3" in username or email');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAllProviders();