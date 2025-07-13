import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { requirePermission } from '@/lib/auth/rbac';
import { getTicketContext } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';

export async function GET(
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
    await requirePermission('ticket', 'read', context);

    // Get the ticket with all related data
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        store: true,
        reporter: {
          select: { id: true, username: true, email: true }
        },
        assigned_provider: {
          select: { id: true, company_name: true, skills: true }
        },
        assignments: {
          orderBy: { assigned_at: 'desc' },
          select: {
            accepted_emp_id: true,
            accepted_phone_number: true,
            rejection_reason: true,
            status: true,
            assigned_at: true,
            accepted_at: true,
            rejected_at: true
          }
        },
        remarks: {
          orderBy: { created_at: 'desc' },
          include: {
            user: {
              select: { id: true, username: true, role: true }
            }
          }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Get ticket error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
} 