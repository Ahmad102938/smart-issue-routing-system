import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8)
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { oldPassword, newPassword } = await request.json();
  const parsed = ChangePasswordSchema.safeParse({ oldPassword, newPassword });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  let isOldPasswordValid = false;
  if (user.force_password_change && user.temp_password_hash) {
    isOldPasswordValid = await bcrypt.compare(oldPassword, user.temp_password_hash);
  } else {
    isOldPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
  }

  if (!isOldPasswordValid) {
    return NextResponse.json({ error: 'Old password is incorrect' }, { status: 400 });
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password_hash: newPasswordHash,
      temp_password_hash: null,
      force_password_change: false
    }
  });

  return NextResponse.json({ success: true });
} 