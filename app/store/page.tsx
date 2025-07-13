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
  Eye
} from 'lucide-react';
import { mockTickets, mockDashboardMetrics } from '@/lib/mockData';

export default function StoreDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [recentTickets, setRecentTickets] = useState(mockTickets.slice(0, 5));

  useEffect(() => {
    console.log('Store dashboard - Session:', session, 'Status:', status);
    
    if (status === 'loading') {
      console.log('Session loading...');
      return;
    }
    
    if (!session?.user) {
      console.log('No session found, redirecting to signin');
      router.push('/auth/signin');
      return;
    }
    
    if (session.user.role !== 'STORE_REGISTER') {
      console.log('User is not store register, redirecting to home');
      router.push('/');
      return;
    }
    
    console.log('User is store register, proceeding to dashboard');
  }, [session, status, router]);

  const handleCreateTicket = () => {
    router.push('/store/create-ticket');
  };

  const handleViewAllTickets = () => {
    router.push('/store/tickets');
  };

  const handleLogout = () => {
    // Set flag to prevent auto-redirect after signout
    sessionStorage.setItem('justSignedOut', 'true');
    signOut({ callbackUrl: '/auth/signin' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-gray-100 text-gray-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading store dashboard...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  // Wrong role
  if (session.user.role !== 'STORE_REGISTER') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Access denied. Redirecting...</p>
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
            value={mockDashboardMetrics.total_tickets}
            icon={Ticket}
            color="blue"
            trend={{ value: 12, isPositive: true }}
          />
          <MetricsCard
            title="Open Issues"
            value={mockDashboardMetrics.open_tickets}
            icon={AlertTriangle}
            color="yellow"
            description="Awaiting assignment"
          />
          <MetricsCard
            title="In Progress"
            value={mockDashboardMetrics.in_progress_tickets}
            icon={Clock}
            color="purple"
            description="Being worked on"
          />
          <MetricsCard
            title="Completed Today"
            value={mockDashboardMetrics.completed_tickets}
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
                  {mockDashboardMetrics.sla_compliance_rate}%
                </p>
                <p className="text-gray-600">SLA Compliance Rate</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  {mockDashboardMetrics.avg_resolution_time}h
                </p>
                <p className="text-gray-600">Avg. Resolution Time</p>
              </div>
            </div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full" 
                style={{ width: `${mockDashboardMetrics.sla_compliance_rate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Tickets</CardTitle>
            <Button variant="outline" onClick={handleViewAllTickets}>
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">#{ticket.id}</span>
                      <Badge className={getPriorityColor(ticket.ai_priority)}>
                        {ticket.ai_priority.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(ticket.status)}>
                        {ticket.status.toUpperCase().replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-gray-700 text-sm line-clamp-1">
                      {ticket.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      📍 {ticket.location_in_store} • {ticket.ai_classification_category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}