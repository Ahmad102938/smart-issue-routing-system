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
        registration_status: 'PENDING'
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

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await prisma.ticket.findMany({
      where: {
        store_id: store.id,
        created_at: { gte: sevenDaysAgo }
      },
      include: {
        reporter: { select: { username: true } },
        assigned_provider: { select: { company_name: true } }
      },
      orderBy: { created_at: 'desc' },
      take: 5
    });

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
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        description: activity.description,
        status: activity.status,
        created_at: activity.created_at,
        reporter: activity.reporter,
        assigned_provider: activity.assigned_provider
      }))
    });

  } catch (error) {
    console.error('Moderator dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 