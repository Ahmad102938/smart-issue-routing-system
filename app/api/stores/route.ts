import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const stores = await prisma.store.findMany({
      include: {
        moderator: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        register_users: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json(stores);
  } catch (error: any) {
    console.error('Fetch stores error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch stores' 
    }, { status: 500 });
  }
} 