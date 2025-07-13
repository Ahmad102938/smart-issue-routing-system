import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'MODERATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Moderator dashboard request from:', session.user.email);

    // Get moderator's assigned store
    const store = await prisma.store.findFirst({
      where: { moderator_user_id: session.user.id },
      include: {
        tickets: {
          include: {
            reporter: {
              select: { id: true, username: true, email: true }
            },
            assigned_provider: {
              select: { id: true, company_name: true }
            },
            remarks: {
              orderBy: { created_at: 'desc' },
              take: 1,
              include: {
                user: {
                  select: { id: true, username: true, role: true }
                }
              }
            }
          },
          orderBy: { created_at: 'desc' },
          take: 10 // Recent tickets
        }
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'No store assigned to moderator' }, { status: 404 });
    }

    // Get pending service providers for approval
    const pendingProviders = await prisma.user.findMany({
      where: {
        role: 'SERVICE_PROVIDER',
        registration_status: 'PENDING',
        service_provider: {
          status: 'PENDING_APPROVAL'
        }
      },
      include: {
        service_provider: true,
        documents: true
      }
    });

    // Get ticket statistics
    const ticketStats = await prisma.ticket.groupBy({
      by: ['status'],
      where: { store_id: store.id },
      _count: { id: true }
    });

    // Calculate metrics
    const totalTickets = store.tickets.length;
    const openTickets = ticketStats.find(s => s.status === 'OPEN')?._count.id || 0;
    const inProgressTickets = ticketStats.find(s => s.status === 'IN_PROGRESS')?._count.id || 0;
    const completedTickets = ticketStats.find(s => s.status === 'COMPLETED')?._count.id || 0;
    const rejectedTickets = ticketStats.find(s => s.status === 'REJECTED_BY_TECH')?._count.id || 0;
    const escalatedTickets = ticketStats.find(s => s.status === 'ESCALATED')?._count.id || 0;

    // Get recent activity (last 7 days) - including tickets, escalations, and remarks
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get recent tickets
    const recentTicketsActivity = await prisma.ticket.findMany({
      where: {
        store_id: store.id,
        created_at: { gte: sevenDaysAgo }
      },
      include: {
        reporter: { select: { username: true } },
        assigned_provider: { select: { company_name: true } }
      },
      orderBy: { created_at: 'desc' },
      take: 10
    });

    // Get recent escalations
    const recentEscalations = await prisma.escalation.findMany({
      where: {
        ticket: {
          store_id: store.id
        },
        triggered_at: { gte: sevenDaysAgo }
      },
      include: {
        ticket: {
          select: { description: true, status: true }
        },
        escalated_to: {
          select: { username: true }
        }
      },
      orderBy: { triggered_at: 'desc' },
      take: 5
    });

    // Get recent remarks
    const recentRemarks = await prisma.remark.findMany({
      where: {
        ticket: {
          store_id: store.id
        },
        created_at: { gte: sevenDaysAgo }
      },
      include: {
        ticket: {
          select: { description: true, status: true }
        },
        user: {
          select: { username: true, role: true }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 5
    });

    // Combine and sort all activities
    const allActivities = [
      ...recentTicketsActivity.map(ticket => ({
        id: `ticket-${ticket.id}`,
        type: 'ticket_created',
        description: `New ticket: ${ticket.description}`,
        status: ticket.status,
        created_at: ticket.created_at,
        reporter: ticket.reporter,
        assigned_provider: ticket.assigned_provider,
        priority: ticket.ai_priority
      })),
      ...recentEscalations.map(escalation => ({
        id: `escalation-${escalation.id}`,
        type: 'escalation',
        description: `Ticket escalated: ${escalation.ticket.description}`,
        status: escalation.status,
        created_at: escalation.triggered_at,
        escalated_to: escalation.escalated_to,
        ticket_status: escalation.ticket.status
      })),
      ...recentRemarks.map(remark => ({
        id: `remark-${remark.id}`,
        type: 'remark',
        description: `Remark added: ${remark.remark_text.substring(0, 50)}${remark.remark_text.length > 50 ? '...' : ''}`,
        status: remark.ticket.status,
        created_at: remark.created_at,
        user: remark.user,
        ticket_description: remark.ticket.description
      }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10); // Take top 10 most recent activities

    // Get SLA compliance for this store
    const completedTicketsWithSLA = await prisma.ticket.findMany({
      where: {
        store_id: store.id,
        status: 'COMPLETED',
        completed_at: { gte: sevenDaysAgo }
      },
      select: {
        completed_at: true,
        sla_deadline: true
      }
    });

    const onTimeCompletions = completedTicketsWithSLA.filter(ticket => 
      ticket.completed_at && ticket.completed_at <= ticket.sla_deadline
    ).length;
    const slaCompliance = completedTicketsWithSLA.length > 0 ? 
      (onTimeCompletions / completedTicketsWithSLA.length) * 100 : 100;

    return NextResponse.json({
      store: {
        id: store.id,
        name: store.name,
        store_id: store.store_id,
        address: store.address,
        city: store.city,
        state: store.state,
        zip_code: store.zip_code,
        status: store.status,
        created_at: store.created_at,
        approved_at: store.approved_at
      },
      metrics: {
        totalTickets,
        openTickets,
        inProgressTickets,
        completedTickets,
        rejectedTickets,
        escalatedTickets,
        pendingProviders: pendingProviders.length,
        slaCompliance: Math.round(slaCompliance * 10) / 10
      },
      pendingProviders: pendingProviders.map(provider => ({
        id: provider.id,
        username: provider.username,
        email: provider.email,
        created_at: provider.created_at,
        service_provider: provider.service_provider ? {
          company_name: provider.service_provider.company_name,
          unique_company_id: provider.service_provider.unique_company_id,
          primary_location_address: provider.service_provider.primary_location_address,
          skills: provider.service_provider.skills,
          capacity_per_day: provider.service_provider.capacity_per_day
        } : null,
        documents: provider.documents
      })),
      recentTickets: store.tickets.map(ticket => ({
        id: ticket.id,
        description: ticket.description,
        status: ticket.status,
        ai_priority: ticket.ai_priority,
        ai_classification_category: ticket.ai_classification_category,
        location_in_store: ticket.location_in_store,
        created_at: ticket.created_at,
        assigned_at: ticket.assigned_at,
        completed_at: ticket.completed_at,
        sla_deadline: ticket.sla_deadline,
        reporter: ticket.reporter,
        assigned_provider: ticket.assigned_provider,
        latest_remark: ticket.remarks[0]
      })),
      recentActivity: allActivities
    });

  } catch (error) {
    console.error('Moderator dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 