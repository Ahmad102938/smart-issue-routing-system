import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { requirePermission } from '@/lib/auth/rbac';
import { aiOrchestrator } from '@/lib/ai/orchestrator';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateTicketSchema = z.object({
  description: z.string().min(10).max(1000),
  location_in_store: z.string().min(1).max(100),
  qr_asset_id: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    await requirePermission('ticket', 'create');

    const body = await request.json();
    const validatedData = CreateTicketSchema.parse(body);

    // Process ticket with AI orchestrator
    const result = await aiOrchestrator.processNewTicket({
      description: validatedData.description,
      location_in_store: validatedData.location_in_store,
      qr_asset_id: validatedData.qr_asset_id,
      store_id: session.user.associated_entity_id!,
      reporter_user_id: session.user.id
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Create ticket error:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    let whereClause: any = {};

    // Apply role-based filtering
    if (session.user.role === 'STORE_REGISTER') {
      whereClause.store_id = session.user.associated_entity_id;
    } else if (session.user.role === 'SERVICE_PROVIDER') {
      whereClause.assigned_service_provider_id = session.user.associated_entity_id;
    } else if (session.user.role === 'MODERATOR') {
      // Get tickets for stores moderated by this user
      const moderatedStores = await prisma.store.findMany({
        where: { moderator_user_id: session.user.id },
        select: { id: true }
      });
      whereClause.store_id = {
        in: moderatedStores.map(s => s.id)
      };
    }
    // Admin sees all tickets (no additional filtering)

    // Apply filters
    if (status && status !== 'all') {
      whereClause.status = status.toUpperCase();
    }
    if (priority && priority !== 'all') {
      whereClause.ai_priority = priority.toUpperCase();
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        store: true,
        reporter: {
          select: { id: true, username: true, email: true }
        },
        assigned_provider: {
          select: { id: true, company_name: true, skills: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Get tickets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}