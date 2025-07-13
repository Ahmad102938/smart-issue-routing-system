import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { requirePermission } from '@/lib/auth/rbac';
import { aiOrchestrator } from '@/lib/ai/orchestrator';
import { z } from 'zod';
import { getTicketContext } from '@/lib/auth/rbac';

const RejectTicketSchema = z.object({
  reason: z.string().min(5).max(200)
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
    await requirePermission('ticket', 'reject', context);

    const body = await request.json();
    const validatedData = RejectTicketSchema.parse(body);

    await aiOrchestrator.handleTicketRejection(
      params.id,
      session.user.associated_provider_id!,
      validatedData.reason
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reject ticket error:', error);
    return NextResponse.json(
      { error: 'Failed to reject ticket' },
      { status: 500 }
    );
  }
}