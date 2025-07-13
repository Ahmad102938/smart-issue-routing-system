import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

// POST - Create moderator and assign to store
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      username, 
      email, 
      password, 
      store_id, 
      admin_user_id 
    } = body;

    // Validate required fields
    if (!username || !email || !password || !store_id || !admin_user_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: username, email, password, store_id, admin_user_id' 
      }, { status: 400 });
    }

    // Verify admin user exists and is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: admin_user_id }
    });

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Only admins can create moderators' 
      }, { status: 403 });
    }

    // Check if store exists
    const store = await prisma.store.findUnique({
      where: { store_id }
    });

    if (!store) {
      return NextResponse.json({ 
        error: 'Store not found with the provided store_id' 
      }, { status: 404 });
    }

    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Username or email already exists' 
      }, { status: 400 });
    }

    // Check if store already has a moderator
    if (store.moderator_user_id) {
      return NextResponse.json({ 
        error: 'Store already has a moderator assigned' 
      }, { status: 400 });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Create moderator and assign to store in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create moderator user
      const moderator = await tx.user.create({
        data: {
          username,
          email,
          password_hash,
          role: UserRole.MODERATOR,
          registration_status: 'APPROVED',
          is_active: true
        }
      });

      // Assign moderator to store
      await tx.store.update({
        where: { id: store.id },
        data: { 
          moderator_user_id: moderator.id,
          status: 'APPROVED'
        }
      });

      return { moderator, store };
    });

    return NextResponse.json({
      message: 'Moderator created and assigned to store successfully',
      moderator: {
        id: result.moderator.id,
        username: result.moderator.username,
        email: result.moderator.email,
        role: result.moderator.role
      },
      store: {
        id: result.store.id,
        name: result.store.name,
        store_id: result.store.store_id
      }
    });

  } catch (error: any) {
    console.error('Moderator creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create moderator', 
      details: error.message 
    }, { status: 500 });
  }
}

// GET - Get all moderators with their assigned stores
export async function GET(request: NextRequest) {
  try {
    const moderators = await prisma.user.findMany({
      where: { role: 'MODERATOR' },
      include: {
        moderated_stores: {
          select: {
            id: true,
            name: true,
            store_id: true,
            address: true,
            city: true,
            state: true,
            status: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json(moderators);
  } catch (error: any) {
    console.error('Fetch moderators error:', error);
    // Return empty array instead of error when database is not available
    if (error.code === 'P1001' || error.message?.includes('Can\'t reach database server')) {
      return NextResponse.json([]);
    }
    return NextResponse.json({ 
      error: 'Failed to fetch moderators' 
    }, { status: 500 });
  }
}

// PATCH - Update moderator assignment or status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { moderator_id, action, store_id } = body;

    if (!moderator_id || !action) {
      return NextResponse.json({ 
        error: 'Missing moderator_id or action' 
      }, { status: 400 });
    }

    const moderator = await prisma.user.findUnique({
      where: { id: moderator_id },
      include: { moderated_stores: true }
    });

    if (!moderator || moderator.role !== 'MODERATOR') {
      return NextResponse.json({ 
        error: 'Moderator not found' 
      }, { status: 404 });
    }

    if (action === 'ASSIGN_STORE') {
      if (!store_id) {
        return NextResponse.json({ 
          error: 'store_id required for assignment' 
        }, { status: 400 });
      }

      const store = await prisma.store.findUnique({
        where: { store_id }
      });

      if (!store) {
        return NextResponse.json({ 
          error: 'Store not found' 
        }, { status: 404 });
      }

      if (store.moderator_user_id) {
        return NextResponse.json({ 
          error: 'Store already has a moderator' 
        }, { status: 400 });
      }

      await prisma.store.update({
        where: { id: store.id },
        data: { moderator_user_id: moderator_id }
      });

      return NextResponse.json({
        message: 'Moderator assigned to store successfully'
      });

    } else if (action === 'REMOVE_STORE') {
      // Remove moderator from all stores
      await prisma.store.updateMany({
        where: { moderator_user_id: moderator_id },
        data: { moderator_user_id: null }
      });

      return NextResponse.json({
        message: 'Moderator removed from store successfully'
      });

    } else if (action === 'DEACTIVATE') {
      await prisma.user.update({
        where: { id: moderator_id },
        data: { is_active: false }
      });

      return NextResponse.json({
        message: 'Moderator deactivated successfully'
      });

    } else if (action === 'ACTIVATE') {
      await prisma.user.update({
        where: { id: moderator_id },
        data: { is_active: true }
      });

      return NextResponse.json({
        message: 'Moderator activated successfully'
      });

    } else {
      return NextResponse.json({ 
        error: 'Invalid action. Use ASSIGN_STORE, REMOVE_STORE, ACTIVATE, or DEACTIVATE' 
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Moderator update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update moderator', 
      details: error.message 
    }, { status: 500 });
  }
} 