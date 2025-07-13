import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { requirePermission } from '@/lib/auth/rbac';
import { getTicketContext } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const AddRemarkSchema = z.object({
  remark_text: z.string().min(1).max(500)
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const context = await getTicketContext(params.id, session.user);
    await requirePermission('remark', 'create', context);

    const body = await request.json();
    const validatedData = AddRemarkSchema.parse(body);

    // Create the remark
    const remark = await prisma.remark.create({
      data: {
        ticket_id: params.id,
        user_id: session.user.id,
        remark_text: validatedData.remark_text
      },
      include: {
        user: {
          select: { id: true, username: true, role: true }
        }
      }
    });

    return NextResponse.json(remark);
  } catch (error) {
    console.error('Add remark error:', error);
    return NextResponse.json(
      { error: 'Failed to add remark' },
      { status: 500 }
    );
  }
} 