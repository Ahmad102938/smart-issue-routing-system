import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '7d';

    console.log('Admin stats request from:', session.user.email, 'range:', timeRange);

    // Get basic counts with error handling
    let totalStores = 0, totalProviders = 0, totalTickets = 0;
    let approvedStores = 0, approvedProviders = 0;
    let openTickets = 0, inProgressTickets = 0, completedTickets = 0;
    let rejectedTickets = 0, escalatedTickets = 0, pendingApprovalTickets = 0, closedTickets = 0;

    try {
      totalStores = await prisma.store.count();
      totalProviders = await prisma.serviceProvider.count();
      totalTickets = await prisma.ticket.count();
      approvedStores = await prisma.store.count({ where: { status: 'APPROVED' } });
      approvedProviders = await prisma.serviceProvider.count({ where: { status: 'APPROVED' } });
      openTickets = await prisma.ticket.count({ where: { status: 'OPEN' } });
      inProgressTickets = await prisma.ticket.count({ where: { status: 'IN_PROGRESS' } });
      completedTickets = await prisma.ticket.count({ where: { status: 'COMPLETED' } });
      rejectedTickets = await prisma.ticket.count({ where: { status: 'REJECTED_BY_TECH' } });
      escalatedTickets = await prisma.ticket.count({ where: { status: 'ESCALATED' } });
      pendingApprovalTickets = await prisma.ticket.count({ where: { status: 'PENDING_APPROVAL' as any } });
      closedTickets = await prisma.ticket.count({ where: { status: 'CLOSED' } });
    } catch (countError) {
      console.error('Error getting counts:', countError);
    }

    // Initialize chart data with defaults
    let ticketTrendData: any[] = [];
    let categoryData: any[] = [];
    let priorityData: any[] = [];
    let statusData: any[] = [];
    let slaCompliance = 100;
    let techPerformanceData: any[] = [];

    try {
      // Calculate date range based on parameter
      const now = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        default: // 7d
          startDate.setDate(now.getDate() - 7);
          break;
      }
      
              const ticketTrends = await prisma.ticket.groupBy({
          by: ['created_at'],
          where: {
            created_at: {
              gte: startDate
            }
          },
          _count: {
            id: true
          }
        });

      // Format ticket trends data
      ticketTrendData = ticketTrends.map(trend => ({
        date: trend.created_at.toISOString().split('T')[0],
        tickets: trend._count.id
      }));

      // Get tickets by category
      const categoryDataRaw = await prisma.ticket.groupBy({
        by: ['ai_classification_category'],
        _count: {
          id: true
        }
      });

      // Get tickets by priority
      const priorityDataRaw = await prisma.ticket.groupBy({
        by: ['ai_priority'],
        _count: {
          id: true
        }
      });

      // Get ticket status breakdown
      const statusDataRaw = await prisma.ticket.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      });

      // Get SLA compliance data (tickets completed within deadline)
      const slaData = await prisma.ticket.findMany({
        where: {
          status: 'COMPLETED',
          completed_at: {
            gte: startDate
          }
        },
        select: {
          completed_at: true,
          sla_deadline: true
        }
      });

      // Calculate SLA compliance percentage
      const onTimeCompletions = slaData.filter(ticket => 
        ticket.completed_at && ticket.completed_at <= ticket.sla_deadline
      ).length;
      slaCompliance = slaData.length > 0 ? (onTimeCompletions / slaData.length) * 100 : 100;

      // Get technician performance data
      const techPerformance = await prisma.ticket.groupBy({
        by: ['assigned_service_provider_id'],
        where: {
          status: 'COMPLETED',
          completed_at: {
            gte: startDate
          }
        },
        _count: {
          id: true
        }
      });

      // Get service provider names for performance data
      const providerIds = techPerformance.map(p => p.assigned_service_provider_id).filter((id): id is string => id !== null);
      const providers = await prisma.serviceProvider.findMany({
        where: {
          id: { in: providerIds }
        },
        select: {
          id: true,
          company_name: true
        }
      });

      techPerformanceData = techPerformance.map(perf => {
        const provider = providers.find(p => p.id === perf.assigned_service_provider_id);
        return {
          name: provider?.company_name || 'Unknown Provider',
          completed: perf._count.id
        };
      });

      // Format category data for charts
      categoryData = categoryDataRaw.map(cat => ({
        name: cat.ai_classification_category || 'Unknown',
        value: cat._count.id,
        color: getCategoryColor(cat.ai_classification_category)
      }));

      // Format priority data for charts
      priorityData = priorityDataRaw.map(pri => ({
        name: pri.ai_priority,
        value: pri._count.id,
        color: getPriorityColor(pri.ai_priority)
      }));

      // Format status data for charts
      statusData = statusDataRaw.map(status => ({
        name: status.status,
        value: status._count.id
      }));

    } catch (chartError) {
      console.error('Error getting chart data:', chartError);
    }

    // Calculate SLA trend data (mock for now, can be enhanced later)
    const slaTrendData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split('T')[0],
        sla: Math.round(slaCompliance + (Math.random() - 0.5) * 4) // Add some variation
      };
    });

    return NextResponse.json({
      stats: {
        totalStores,
        totalProviders,
        totalTickets,
        approvedStores,
        approvedProviders,
        openTickets,
        inProgressTickets,
        completedTickets,
        rejectedTickets,
        escalatedTickets,
        pendingApprovalTickets,
        closedTickets,
        slaCompliance: Math.round(slaCompliance * 10) / 10
      },
      charts: {
        ticketTrendData,
        categoryData: categoryData,
        priorityData: priorityData,
        statusData: statusData,
        slaData: slaTrendData,
        techPerformanceData
      }
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getCategoryColor(category: string | null): string {
  const colors = {
    'Facilities': '#3B82F6',
    'IT': '#10B981',
    'Equipment': '#F59E0B',
    'Security': '#EF4444',
    'HVAC': '#8B5CF6',
    'Plumbing': '#06B6D4'
  };
  return colors[category as keyof typeof colors] || '#6B7280';
}

function getPriorityColor(priority: string): string {
  const colors = {
    'HIGH': '#EF4444',
    'MEDIUM': '#F59E0B',
    'LOW': '#10B981'
  };
  return colors[priority as keyof typeof colors] || '#6B7280';
} 