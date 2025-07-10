import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UserRole, StoreStatus, ServiceProviderStatus } from '@prisma/client';

const StoreRegisterSchema = z.object({
  type: z.literal('store'),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  phone_number: z.string().optional(),
  store_name: z.string().min(1),
  store_id: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip_code: z.string().min(1),
  latitude: z.number(),
  longitude: z.number()
});

const ServiceProviderRegisterSchema = z.object({
  type: z.literal('service_provider'),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  phone_number: z.string().optional(),
  company_name: z.string().min(1),
  unique_company_id: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  skills: z.array(z.string()).min(1),
  capacity_per_day: z.number().min(1).max(20)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.type === 'store') {
      const validatedData = StoreRegisterSchema.parse(body);
      
      // Check if username or email already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: validatedData.username },
            { email: validatedData.email }
          ]
        }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username or email already exists' },
          { status: 400 }
        );
      }

      // Check if store_id already exists
      const existingStore = await prisma.store.findUnique({
        where: { store_id: validatedData.store_id }
      });

      if (existingStore) {
        return NextResponse.json(
          { error: 'Store ID already exists' },
          { status: 400 }
        );
      }

      // Hash password
      const password_hash = await bcrypt.hash(validatedData.password, 12);

      // Create store and user in transaction
      const result = await prisma.$transaction(async (tx) => {
        const store = await tx.store.create({
          data: {
            name: validatedData.store_name,
            store_id: validatedData.store_id,
            address: validatedData.address,
            city: validatedData.city,
            state: validatedData.state,
            zip_code: validatedData.zip_code,
            location_coordinates: {
              latitude: validatedData.latitude,
              longitude: validatedData.longitude
            },
            status: StoreStatus.PENDING_APPROVAL
          }
        });

        const user = await tx.user.create({
          data: {
            username: validatedData.username,
            email: validatedData.email,
            password_hash,
            phone_number: validatedData.phone_number,
            role: UserRole.STORE_REGISTER,
            associated_entity_id: store.id
          }
        });

        return { store, user };
      });

      return NextResponse.json({
        message: 'Store registration submitted for approval',
        store_id: result.store.id
      });

    } else if (body.type === 'service_provider') {
      const validatedData = ServiceProviderRegisterSchema.parse(body);
      
      // Check if username or email already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: validatedData.username },
            { email: validatedData.email }
          ]
        }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username or email already exists' },
          { status: 400 }
        );
      }

      // Check if company_id already exists
      const existingProvider = await prisma.serviceProvider.findUnique({
        where: { unique_company_id: validatedData.unique_company_id }
      });

      if (existingProvider) {
        return NextResponse.json(
          { error: 'Company ID already exists' },
          { status: 400 }
        );
      }

      // Hash password
      const password_hash = await bcrypt.hash(validatedData.password, 12);

      // Create service provider and user in transaction
      const result = await prisma.$transaction(async (tx) => {
        const serviceProvider = await tx.serviceProvider.create({
          data: {
            company_name: validatedData.company_name,
            unique_company_id: validatedData.unique_company_id,
            primary_location_address: validatedData.address,
            primary_location_coordinates: {
              latitude: validatedData.latitude,
              longitude: validatedData.longitude
            },
            skills: validatedData.skills,
            capacity_per_day: validatedData.capacity_per_day,
            status: ServiceProviderStatus.PENDING_APPROVAL
          }
        });

        const user = await tx.user.create({
          data: {
            username: validatedData.username,
            email: validatedData.email,
            password_hash,
            phone_number: validatedData.phone_number,
            role: UserRole.SERVICE_PROVIDER,
            associated_entity_id: serviceProvider.id
          }
        });

        return { serviceProvider, user };
      });

      return NextResponse.json({
        message: 'Service provider registration submitted for approval',
        provider_id: result.serviceProvider.id
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid registration type' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}