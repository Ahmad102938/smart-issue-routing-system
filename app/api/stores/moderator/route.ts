import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const moderatorId = session.user.id;

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