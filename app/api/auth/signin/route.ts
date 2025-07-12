import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        store: true,
        service_provider: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 401 });
    }

    // Check if user is approved (for non-admin users)
    if (user.role !== 'ADMIN' && user.registration_status !== 'APPROVED') {
      return NextResponse.json({ 
        error: user.registration_status === 'PENDING' 
          ? 'Account is pending approval' 
          : 'Account has been rejected' 
      }, { status: 401 });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Return user data (without password)
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      registration_status: user.registration_status,
      is_active: user.is_active,
      store: user.store,
      service_provider: user.service_provider
    };

    return NextResponse.json({
      message: 'Login successful',
      user: userData
    });

  } catch (error: any) {
    console.error('Signin error:', error);
    
    // Check if it's a database connection error
    if (error.message && error.message.includes('Can\'t reach database server')) {
      return NextResponse.json({ 
        error: 'Database connection failed. Please check your database configuration.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Login failed', 
      details: error.message 
    }, { status: 500 });
  }
} 