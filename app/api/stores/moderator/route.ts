import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get the moderator user ID from the request headers or query params
    // In a real app, this would come from authentication middleware
    const url = new URL(request.url);
    const moderatorId = url.searchParams.get('moderator_id');
    
    if (!moderatorId) {
      return NextResponse.json({ 
        error: 'Moderator ID is required' 
      }, { status: 400 });
    }

    // Verify the user is a moderator
    const moderator = await prisma.user.findUnique({
      where: { id: moderatorId }
    });

    if (!moderator || moderator.role !== 'MODERATOR') {
      return NextResponse.json({ 
        error: 'User is not a moderator' 
      }, { status: 403 });
    }

    // Get the store assigned to this moderator
    const store = await prisma.store.findFirst({
      where: { moderator_user_id: moderatorId },
      include: {
        tickets: {
          orderBy: { created_at: 'desc' },
          take: 10
        },
        register_users: {
          select: {
            id: true,
            username: true,
            email: true,
            is_active: true
          }
        }
      }
    });

    if (!store) {
      return NextResponse.json({ 
        error: 'No store assigned to this moderator' 
      }, { status: 404 });
    }

    return NextResponse.json(store);

  } catch (error: any) {
    console.error('Get moderator store error:', error);
    return NextResponse.json({ 
      error: 'Failed to get moderator store data' 
    }, { status: 500 });
  }
} 