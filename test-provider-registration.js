const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestProvider() {
    try {
        console.log('Creating test service provider...\n');

        // Check if test provider already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: 'test_provider' },
                    { email: 'test_provider@example.com' }
                ]
            }
        });

        if (existingUser) {
            console.log('Test provider already exists, deleting...');
            await prisma.user.delete({
                where: { id: existingUser.id }
            });
        }

        // Check if test company already exists
        const existingProvider = await prisma.serviceProvider.findUnique({
            where: { unique_company_id: 'TEST_COMPANY_001' }
        });

        if (existingProvider) {
            console.log('Test company already exists, deleting...');
            await prisma.serviceProvider.delete({
                where: { id: existingProvider.id }
            });
        }

        // Hash password
        const password_hash = await bcrypt.hash('test123', 12);

        // Create service provider and user in transaction
        const result = await prisma.$transaction(async(tx) => {
            const serviceProvider = await tx.serviceProvider.create({
                data: {
                    company_name: 'Test Service Company',
                    unique_company_id: 'TEST_COMPANY_001',
                    primary_location_address: '123 Test Street, Test City, TS 12345',
                    primary_location_coordinates: {
                        latitude: 40.7128,
                        longitude: -74.0060
                    },
                    skills: ['Plumbing', 'Electrical', 'HVAC'],
                    capacity_per_day: 5,
                    status: 'PENDING_APPROVAL'
                }
            });

            const user = await tx.user.create({
                data: {
                    username: 'test_provider',
                    email: 'test_provider@example.com',
                    password_hash,
                    role: 'SERVICE_PROVIDER',
                    associated_provider_id: serviceProvider.id,
                    registration_status: 'PENDING',
                }
            });

            return { serviceProvider, user };
        });

        console.log('Test service provider created successfully!');
        console.log(`User ID: ${result.user.id}`);
        console.log(`Provider ID: ${result.serviceProvider.id}`);
        console.log(`Username: ${result.user.username}`);
        console.log(`Email: ${result.user.email}`);
        console.log(`Registration Status: ${result.user.registration_status}`);
        console.log(`Provider Status: ${result.serviceProvider.status}`);

        // Now check if it appears in pending providers
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

        console.log(`\nPending service providers: ${pendingProviders.length}`);
        pendingProviders.forEach(provider => {
            console.log(`- ${provider.username} (${provider.email})`);
            console.log(`  Company: ${provider.service_provider?.company_name}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestProvider();