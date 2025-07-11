import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { requirePermission } from '@/lib/auth/rbac';
import { aiOrchestrator } from '@/lib/ai/orchestrator';
import { z } from 'zod';
import { getTicketContext } from '@/lib/auth/rbac';

const AcceptTicketSchema = z.object({
  emp_id: z.string().min(1),
  phone_number: z.string().min(10)
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
    await requirePermission('ticket', 'accept', context);

    const body = await request.json();
    const validatedData = AcceptTicketSchema.parse(body);

    await aiOrchestrator.handleTicketAcceptance(
      params.id,
      session.user.associated_entity_id!,
      validatedData.emp_id,
      validatedData.phone_number
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Accept ticket error:', error);
    return NextResponse.json(
      { error: 'Failed to accept ticket' },
      { status: 500 }
    );
  }
}