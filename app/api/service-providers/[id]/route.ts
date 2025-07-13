import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is requesting their own service provider data
    if (session.user.role !== 'SERVICE_PROVIDER' || session.user.associated_provider_id !== params.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const serviceProvider = await prisma.serviceProvider.findUnique({
      where: { id: params.id },
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

    if (!serviceProvider) {
      return NextResponse.json({ error: 'Service provider not found' }, { status: 404 });
    }

    return NextResponse.json(serviceProvider);
  } catch (error) {
    console.error('Get service provider error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service provider' },
      { status: 500 }
    );
  }
} 