import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { requirePermission } from '@/lib/auth/rbac';
import { aiOrchestrator } from '@/lib/ai/orchestrator';
import { getTicketContext } from '@/lib/auth/rbac';
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

    // Check permissions
    const context = await getTicketContext(params.id, session.user);
    await requirePermission('ticket', 'complete', context);

    await aiOrchestrator.handleTicketCompletion(
      params.id,
      session.user.associated_provider_id!
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Complete ticket error:', error);
    return NextResponse.json(
      { error: 'Failed to complete ticket' },
      { status: 500 }
    );
  }
}