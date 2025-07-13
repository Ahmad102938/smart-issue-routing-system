'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MetricsCard from '@/components/dashboard/MetricsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Ticket, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Plus,
  TrendingUp,
  Eye,
  Building2,
  MapPin,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function StoreDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [storeMetrics, setStoreMetrics] = useState({
    total_tickets: 0,
    open_tickets: 0,
    in_progress_tickets: 0,
    completed_tickets: 0,
    sla_compliance_rate: 0,
    avg_resolution_time: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 5;

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }
    if (session.user.role !== 'STORE_REGISTER') {
      router.push('/');
      return;
    }

    // Fetch real tickets for this store
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/tickets');
        if (!res.ok) throw new Error('Failed to fetch tickets');
        const data = await res.json();
        // Filter tickets for this store
        const storeTickets = data.filter(
          (ticket: any) => ticket.store_id === session.user.associated_store_id
        );
        setAllTickets(storeTickets);
        
        // Calculate pagination for recent tickets
        const startIndex = (currentPage - 1) * ticketsPerPage;
        const endIndex = startIndex + ticketsPerPage;
        setRecentTickets(storeTickets.slice(startIndex, endIndex));
        
        // Calculate real metrics
        const totalTickets = storeTickets.length;
        const openTickets = storeTickets.filter((t: any) => t.status === 'OPEN').length;
        const inProgressTickets = storeTickets.filter((t: any) => t.status === 'IN_PROGRESS').length;
        const completedTickets = storeTickets.filter((t: any) => t.status === 'COMPLETED').length;
        
        // Calculate real SLA compliance rate
        const completedTicketsWithSLA = storeTickets.filter((t: any) => 
          t.status === 'COMPLETED' && t.completed_at && t.sla_deadline
        );
        
        let slaCompliantCount = 0;
        let totalResolutionTime = 0;
        let resolutionTimeCount = 0;
        
        completedTicketsWithSLA.forEach((ticket: any) => {
          const completedAt = new Date(ticket.completed_at);
          const slaDeadline = new Date(ticket.sla_deadline);
          const createdAt = new Date(ticket.created_at);
          
          // Check if completed before SLA deadline
          if (completedAt <= slaDeadline) {
            slaCompliantCount++;
          }
          
          // Calculate resolution time in hours
          const resolutionTimeHours = (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          totalResolutionTime += resolutionTimeHours;
          resolutionTimeCount++;
        });
        
        const slaComplianceRate = completedTicketsWithSLA.length > 0 
          ? Math.round((slaCompliantCount / completedTicketsWithSLA.length) * 100)
          : 0;
        
        const avgResolutionTime = resolutionTimeCount > 0 
          ? Math.round((totalResolutionTime / resolutionTimeCount) * 10) / 10
          : 0;
        
        setStoreMetrics({
          total_tickets: totalTickets,
          open_tickets: openTickets,
          in_progress_tickets: inProgressTickets,
          completed_tickets: completedTickets,
          sla_compliance_rate: slaComplianceRate,
          avg_resolution_time: avgResolutionTime
        });
        setError(null);
      } catch (err) {
        setRecentTickets([]);
        setAllTickets([]);
        setStoreMetrics({
          total_tickets: 0,
          open_tickets: 0,
          in_progress_tickets: 0,
          completed_tickets: 0,
          sla_compliance_rate: 0,
          avg_resolution_time: 0
        });
        setError('Failed to fetch tickets');
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [session, status, router, currentPage]);

  const handleCreateTicket = () => {
    router.push('/store/create-ticket');
  };

  const handleViewAllTickets = () => {
    router.push('/store/tickets');
  };

  const handleLogout = () => {
    sessionStorage.setItem('justSignedOut', 'true');
    signOut({ callbackUrl: '/auth/signin' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-gray-100 text-gray-800';
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'REJECTED_BY_TECH': return 'bg-red-100 text-red-800';
      case 'ESCALATED': return 'bg-orange-100 text-orange-800';
      case 'PENDING_APPROVAL': return 'bg-purple-100 text-purple-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPages = Math.ceil(allTickets.length / ticketsPerPage);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading store dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  if (session.user.role !== 'STORE_REGISTER') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Access denied. Redirecting...</p>
        </div>
      </div>
    );
  }

  if (!session.user.store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Store Information Not Found</h1>
          <p>Unable to load your store information. Please contact support.</p>
          <button 
            onClick={() => router.push('/auth/signin')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Sign In Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Store Dashboard">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Store Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Manage equipment issues and track repair progress
            </p>
            {/* Store Information */}
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                <span>{session.user.store.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{session.user.store.city}, {session.user.store.state}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                Store ID: {session.user.store.store_id}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Welcome, {session.user.username || session.user.email}
            </span>
            <Button 
              onClick={handleCreateTicket}
              className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Report New Issue
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="Total Tickets"
            value={storeMetrics.total_tickets}
            icon={Ticket}
            color="blue"
            trend={{ value: 12, isPositive: true }}
          />
          <MetricsCard
            title="Open Issues"
            value={storeMetrics.open_tickets}
            icon={AlertTriangle}
            color="yellow"
            description="Awaiting assignment"
          />
          <MetricsCard
            title="In Progress"
            value={storeMetrics.in_progress_tickets}
            icon={Clock}
            color="purple"
            description="Being worked on"
          />
          <MetricsCard
            title="Completed Today"
            value={storeMetrics.completed_tickets}
            icon={CheckCircle2}
            color="green"
            trend={{ value: 8, isPositive: true }}
          />
        </div>

        {/* SLA Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              SLA Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-emerald-600">
                  {storeMetrics.sla_compliance_rate}%
                </p>
                <p className="text-gray-600">SLA Compliance Rate</p>
                <p className="text-xs text-gray-500 mt-1">
                  Based on {storeMetrics.completed_tickets} completed tickets
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">
                  {storeMetrics.avg_resolution_time}h
                </p>
                <p className="text-gray-600">Avg. Resolution Time</p>
                <p className="text-xs text-gray-500 mt-1">
                  From creation to completion
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Tickets with Pagination */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-blue-600" />
              Recent Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-100">
              {recentTickets.length === 0 && (
                <div className="py-8 text-center text-gray-500">
                  No recent tickets found.
                </div>
              )}
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getPriorityColor(ticket.ai_priority)}>
                        {ticket.ai_priority}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(ticket.status)}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="font-medium text-gray-900 line-clamp-1">
                      {ticket.description}
                    </div>
                    <div className="text-xs text-gray-500">
                      {ticket.location_in_store} | {ticket.ai_classification_category} - {ticket.ai_classification_subcategory}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/store/tickets?id=${ticket.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {ticket.status === 'PENDING_APPROVAL' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 text-white hover:bg-green-700"
                          onClick={async () => {
                            await fetch(`/api/tickets/${ticket.id}/approve-completion`, { method: 'POST' });
                            // Refresh tickets
                            setLoading(true);
                            setCurrentPage(1);
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-600 text-white hover:bg-red-700"
                          onClick={async () => {
                            await fetch(`/api/tickets/${ticket.id}/reject-completion`, { method: 'POST' });
                            // Refresh tickets
                            setLoading(true);
                            setCurrentPage(1);
                          }}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {allTickets.length > ticketsPerPage && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * ticketsPerPage) + 1} to {Math.min(currentPage * ticketsPerPage, allTickets.length)} of {allTickets.length} tickets
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <div className="pt-4 text-right">
              <Button variant="link" onClick={handleViewAllTickets}>
                View All Tickets
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}