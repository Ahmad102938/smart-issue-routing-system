import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateCapacitySchema = z.object({
  capacity: z.number().min(1).max(20)
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is updating their own service provider data
    if (session.user.role !== 'SERVICE_PROVIDER' || session.user.associated_provider_id !== params.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = UpdateCapacitySchema.parse(body);

    const serviceProvider = await prisma.serviceProvider.update({
      where: { id: params.id },
      data: {
        capacity_per_day: validatedData.capacity
      },
      select: {
        id: true,
        company_name: true,
        current_load: true,
        capacity_per_day: true,
        skills: true,
        unique_company_id: true,
        status: true
      }
    });

    return NextResponse.json(serviceProvider);
  } catch (error) {
    console.error('Update capacity error:', error);
    return NextResponse.json(
      { error: 'Failed to update capacity' },
      { status: 500 }
    );
  }
} 