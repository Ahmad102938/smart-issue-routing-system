const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTicketWorkflow() {
    try {
        console.log('🧪 Testing ticket workflow...');

        // Check stores
        const stores = await prisma.store.findMany({
            select: { id: true, name: true, city: true }
        });
        console.log(`\n📦 Stores: ${stores.length}`);
        stores.forEach(store => {
            console.log(`  - ${store.name} (${store.city}) - ID: ${store.id}`);
        });

        // Check service providers
        const providers = await prisma.serviceProvider.findMany({
            select: {
                id: true,
                company_name: true,
                status: true,
                skills: true,
                capacity_per_day: true,
                current_load: true
            }
        });
        console.log(`\n🔧 Service Providers: ${providers.length}`);
        providers.forEach(provider => {
            console.log(`  - ${provider.company_name} (${provider.status})`);
            console.log(`    Skills: ${provider.skills.join(', ')}`);
            console.log(`    Capacity: ${provider.current_load}/${provider.capacity_per_day}`);
        });

        // Check approved providers
        const approvedProviders = providers.filter(p => p.status === 'APPROVED');
        console.log(`\n✅ Approved Providers: ${approvedProviders.length}`);

        // Check users
        const users = await prisma.user.findMany({
            where: { role: 'SERVICE_PROVIDER' },
            select: { id: true, username: true, email: true, is_active: true }
        });
        console.log(`\n👥 Service Provider Users: ${users.length}`);
        users.forEach(user => {
            console.log(`  - ${user.username} (${user.email}) - Active: ${user.is_active}`);
        });

        // Check tickets
        const tickets = await prisma.ticket.findMany({
            select: {
                id: true,
                description: true,
                status: true,
                ai_classification_category: true,
                ai_classification_subcategory: true,
                ai_priority: true
            },
            orderBy: { created_at: 'desc' },
            take: 5
        });
        console.log(`\n🎫 Recent Tickets: ${tickets.length}`);
        tickets.forEach(ticket => {
            console.log(`  - ${ticket.description.substring(0, 50)}...`);
            console.log(`    Status: ${ticket.status}, Category: ${ticket.ai_classification_category}/${ticket.ai_classification_subcategory}, Priority: ${ticket.ai_priority}`);
        });

        console.log('\n📋 Workflow Analysis:');
        if (approvedProviders.length === 0) {
            console.log('❌ No approved service providers - tickets cannot be assigned');
        } else {
            console.log('✅ Approved providers available for assignment');
        }

        if (users.filter(u => u.is_active).length === 0) {
            console.log('❌ No active service provider users - providers cannot accept tickets');
        } else {
            console.log('✅ Active service provider users available');
        }

        console.log('\n🎯 Recommendations:');
        if (approvedProviders.length === 0) {
            console.log('1. Approve at least one service provider');
        }
        if (users.filter(u => u.is_active).length === 0) {
            console.log('2. Activate service provider user accounts');
        }
        if (approvedProviders.length > 0 && users.filter(u => u.is_active).length > 0) {
            console.log('3. Create a test ticket to verify the workflow');
        }

    } catch (error) {
        console.error('❌ Error testing workflow:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testTicketWorkflow();