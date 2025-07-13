import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { requirePermission, getTicketContext } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Check permissions (store only)
    const context = await getTicketContext(params.id, session.user);
    await requirePermission('ticket', 'approve_completion', context);

    await prisma.ticket.update({
      where: { id: params.id },
      data: {
        status: 'COMPLETED',
        completed_at: new Date()
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Approve completion error:', error);
    return NextResponse.json(
      { error: 'Failed to approve completion' },
      { status: 500 }
    );
  }
} 