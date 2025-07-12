import { PrismaClient, UserRole, StoreStatus, ServiceProviderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@walmart.com',
      password_hash: adminPassword,
      role: UserRole.ADMIN,
      phone_number: '+1-555-0001'
    }
  });

  // Create a sample store
  const store = await prisma.store.upsert({
    where: { store_id: '3482' },
    update: {},
    create: {
      name: 'Walmart Supercenter Dallas',
      store_id: '3482',
      address: '1234 Main Street',
      city: 'Dallas',
      state: 'TX',
      zip_code: '75201',
      location_coordinates: {
        latitude: 32.7767,
        longitude: -96.7970
      },
      status: StoreStatus.APPROVED,
      approved_at: new Date()
    }
  });

  // Create moderator for the store
  const moderatorPassword = await bcrypt.hash('moderator123', 12);
  const moderator = await prisma.user.upsert({
    where: { username: 'moderator_dallas' },
    update: {},
    create: {
      username: 'moderator_dallas',
      email: 'moderator@walmart-dallas.com',
      password_hash: moderatorPassword,
      role: UserRole.MODERATOR,
      phone_number: '+1-555-0002'
    }
  });

  // Update store with moderator
  await prisma.store.update({
    where: { id: store.id },
    data: { moderator_user_id: moderator.id }
  });

  // Create store register user
  const storePassword = await bcrypt.hash('store123', 12);
  const storeUser = await prisma.user.upsert({
    where: { username: 'store_dallas' },
    update: {},
    create: {
      username: 'store_dallas',
      email: 'manager@walmart-dallas.com',
      password_hash: storePassword,
      role: UserRole.STORE_REGISTER,
      associated_store_id: store.id,
      phone_number: '+1-555-0003'
    }
  });

  // Create service provider
  const serviceProvider = await prisma.serviceProvider.upsert({
    where: { unique_company_id: 'ETS-2024-001' },
    update: {},
    create: {
      company_name: 'Elite Tech Services',
      unique_company_id: 'ETS-2024-001',
      primary_location_address: '9999 Service Drive, Dallas, TX 75202',
      primary_location_coordinates: {
        latitude: 32.7831,
        longitude: -96.8067
      },
      skills: ['Refrigeration', 'HVAC', 'POS Systems', 'Electrical'],
      capacity_per_day: 5,
      current_load: 0,
      status: ServiceProviderStatus.APPROVED,
      approved_by_moderator_id: moderator.id,
      approved_at: new Date()
    }
  });

  // Create service provider user
  const techPassword = await bcrypt.hash('tech123', 12);
  const techUser = await prisma.user.upsert({
    where: { username: 'tech_john' },
    update: {},
    create: {
      username: 'tech_john',
      email: 'john@elitetech.com',
      password_hash: techPassword,
      role: UserRole.SERVICE_PROVIDER,
      associated_provider_id: serviceProvider.id,
      phone_number: '+1-555-0004'
    }
  });

  console.log('Database seeded successfully!');
  console.log('Demo accounts created:');
  console.log('- Admin: admin / admin123');
  console.log('- Moderator: moderator_dallas / moderator123');
  console.log('- Store: store_dallas / store123');
  console.log('- Technician: tech_john / tech123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });