import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'MODERATOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the moderator's associated store
    const moderator = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        moderated_stores: true,
      },
    });

    if (!moderator?.moderated_stores?.[0]) {
      return NextResponse.json({ error: 'No store associated with moderator' }, { status: 404 });
    }

    const store = moderator.moderated_stores[0];
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Get all tickets for this store
    const allTickets = await prisma.ticket.findMany({
      where: { store_id: store.id },
      include: {
        remarks: true,
        escalations: true,
      },
    });

    // Get tickets in time range
    const ticketsInRange = allTickets.filter(ticket => 
      new Date(ticket.created_at) >= startDate
    );

    // Calculate overview metrics
    const totalTickets = allTickets.length;
    const openTickets = allTickets.filter(t => 
      ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_APPROVAL'].includes(t.status)
    ).length;
    const completedTickets = allTickets.filter(t => t.status === 'COMPLETED').length;
    const rejectedTickets = allTickets.filter(t => t.status === 'REJECTED_BY_TECH').length;

    // Calculate average resolution time (for completed tickets)
    const completedTicketsWithTime = allTickets.filter(t => 
      t.status === 'COMPLETED' && t.completed_at && t.created_at
    );
    const totalResolutionTime = completedTicketsWithTime.reduce((sum, ticket) => {
      const resolutionTime = new Date(ticket.completed_at!).getTime() - new Date(ticket.created_at).getTime();
      return sum + resolutionTime;
    }, 0);
    const averageResolutionTime = completedTicketsWithTime.length > 0 
      ? Math.round(totalResolutionTime / completedTicketsWithTime.length / (1000 * 60)) // Convert to minutes
      : 0;

    // Calculate SLA compliance (assuming 24-hour SLA for now)
    const slaDeadline = 24 * 60; // 24 hours in minutes
    const onTimeTickets = completedTicketsWithTime.filter(ticket => {
      const resolutionTime = new Date(ticket.completed_at!).getTime() - new Date(ticket.created_at).getTime();
      return resolutionTime <= slaDeadline * 60 * 1000; // Convert to milliseconds
    }).length;
    const slaComplianceRate = completedTicketsWithTime.length > 0 
      ? Math.round((onTimeTickets / completedTicketsWithTime.length) * 100)
      : 100;

    // Generate ticket trends data
    const ticketTrends = [];
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTickets = ticketsInRange.filter(ticket => 
        ticket.created_at.toISOString().split('T')[0] === dateStr
      );
      
      const opened = dayTickets.length;
      const completed = dayTickets.filter(t => 
        t.status === 'COMPLETED' && t.completed_at?.toISOString().split('T')[0] === dateStr
      ).length;
      const rejected = dayTickets.filter(t => 
        t.status === 'REJECTED_BY_TECH' && t.created_at.toISOString().split('T')[0] === dateStr
      ).length;

      ticketTrends.push({
        date: dateStr,
        opened,
        completed,
        rejected,
      });
    }

    // Calculate status distribution
    const statusCounts = allTickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: Math.round((count / totalTickets) * 100),
    }));

    // Calculate priority distribution
    const priorityCounts = allTickets.reduce((acc, ticket) => {
      acc[ticket.ai_priority] = (acc[ticket.ai_priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const priorityDistribution = Object.entries(priorityCounts).map(([priority, count]) => ({
      priority,
      count,
      percentage: Math.round((count / totalTickets) * 100),
    }));

    // Calculate SLA metrics
    const slaMetrics = {
      onTime: onTimeTickets,
      late: completedTicketsWithTime.length - onTimeTickets,
      critical: allTickets.filter(t => 
        t.ai_priority === 'HIGH' && ['OPEN', 'ASSIGNED', 'IN_PROGRESS'].includes(t.status)
      ).length,
      averageTime: averageResolutionTime,
    };

    // Generate recent activity
    const recentActivity = [];
    
    // Add recent ticket creations
    const recentTickets = allTickets
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
    
    for (const ticket of recentTickets) {
      recentActivity.push({
        id: `ticket-${ticket.id}`,
        action: 'Ticket Created',
        timestamp: ticket.created_at.toISOString().split('T')[0],
        description: `New ${ticket.ai_priority.toLowerCase()} priority ticket: ${ticket.ai_classification_category}`,
      });
    }

    // Add recent status changes (using completed_at, assigned_at, etc. as proxies for updates)
    const recentStatusChanges = allTickets
      .filter(t => t.completed_at || t.assigned_at || t.accepted_at)
      .sort((a, b) => {
        const aTime = a.completed_at || a.assigned_at || a.accepted_at || a.created_at;
        const bTime = b.completed_at || b.assigned_at || b.accepted_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      })
      .slice(0, 3);

    for (const ticket of recentStatusChanges) {
      const updateTime = ticket.completed_at || ticket.assigned_at || ticket.accepted_at || ticket.created_at;
      recentActivity.push({
        id: `status-${ticket.id}`,
        action: 'Status Updated',
        timestamp: updateTime.toISOString().split('T')[0],
        description: `Ticket status changed to ${ticket.status}`,
      });
    }

    // Sort activity by timestamp
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Calculate top issues by category
    const categoryCounts = allTickets.reduce((acc, ticket) => {
      acc[ticket.ai_classification_category] = (acc[ticket.ai_classification_category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topIssues = Object.entries(categoryCounts)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / totalTickets) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const analytics = {
      store: {
        id: store.id,
        name: store.name,
        store_id: store.store_id,
        address: store.address,
        city: store.city,
        state: store.state,
        status: store.status,
      },
      overview: {
        totalTickets,
        openTickets,
        completedTickets,
        rejectedTickets,
        averageResolutionTime,
        slaComplianceRate,
      },
      ticketTrends,
      statusDistribution,
      priorityDistribution,
      slaMetrics,
      recentActivity: recentActivity.slice(0, 8),
      topIssues,
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching moderator analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 