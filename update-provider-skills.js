const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateProviderSkills() {
    try {
        console.log('🔧 Updating service provider skills...');

        // Get the existing provider
        const provider = await prisma.serviceProvider.findFirst({
            where: { company_name: 'twc ltd' }
        });

        if (!provider) {
            console.log('❌ Provider not found');
            return;
        }

        console.log(`Found provider: ${provider.company_name}`);
        console.log(`Current skills: ${provider.skills.join(', ')}`);

        // Update with more diverse skills
        const updatedSkills = [
            'Software', 'IT Support', 'General Maintenance',
            'Electrical', 'HVAC', 'Refrigeration', 'Plumbing',
            'POS Systems', 'Network', 'Computer Repair'
        ];

        await prisma.serviceProvider.update({
            where: { id: provider.id },
            data: { skills: updatedSkills }
        });

        console.log(`✅ Updated skills to: ${updatedSkills.join(', ')}`);
        console.log('\n🎯 Now the provider can handle multiple ticket types!');

    } catch (error) {
        console.error('❌ Error updating provider skills:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateProviderSkills();