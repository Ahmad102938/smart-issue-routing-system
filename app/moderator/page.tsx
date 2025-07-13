'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MetricsCard from '@/components/dashboard/MetricsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Store, 
  Users, 
  Ticket, 
  CheckCircle2, 
  AlertTriangle,
  Settings,
  TrendingUp,
  Eye,
  UserCheck,
  UserX,
  Clock,
  MapPin,
  Building2,
  Activity,
  BarChart3,
  Loader2,
  RefreshCw,
  Calendar,
  Target,
  Shield,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ModeratorDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // Load moderator's dashboard data
  useEffect(() => {
    async function loadModeratorData() {
      if (!session?.user?.id) return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/moderator/dashboard');
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        } else {
          console.error('Failed to load moderator data');
          toast({
            title: "Error",
            description: "Failed to load dashboard data",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error loading moderator data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      loadModeratorData();
    }
  }, [session, status, toast]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/moderator/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        toast({
          title: "Success",
          description: "Dashboard refreshed successfully",
        });
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    
    if (session?.user?.role !== 'MODERATOR') {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  const handleProviderAction = async (userId: string, action: 'APPROVE' | 'REJECT') => {
    setActionMsg('');
    try {
      const response = await fetch('/api/auth/register', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          action,
          moderator_id: session?.user?.id 
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setActionMsg(`Provider ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully.`);
        // Refresh dashboard data
        await handleRefresh();
        toast({
          title: `Provider ${action === 'APPROVE' ? 'Approved' : 'Rejected'}`,
          description: `Service provider has been ${action === 'APPROVE' ? 'approved' : 'rejected'}.`,
        });
      } else {
        setActionMsg(data.error || 'Action failed.');
      }
    } catch (error) {
      setActionMsg('Action failed. Please try again.');
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Loading Dashboard...</h1>
          <p className="text-gray-600">Please wait while we load your moderator dashboard.</p>
        </div>
      </div>
    );
  }

  if (!dashboardData?.store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4 text-gray-800">No Store Assigned</h1>
          <p className="text-gray-600 mb-6">You haven&apos;t been assigned to any store yet. Please contact an administrator.</p>
          <button 
            onClick={handleLogout}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  const { store, metrics, pendingProviders, recentTickets, recentActivity } = dashboardData;

  return (
    <DashboardLayout title="Moderator Dashboard">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Store Moderator Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Managing {store.name} ({store.store_id})
            </p>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {store.address}, {store.city}, {store.state}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
            <span className="text-sm text-gray-600">
              Welcome, <span className="font-semibold text-blue-600">{session?.user?.username}</span>
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-blue-200" onClick={() => router.push('/moderator/tickets')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Ticket className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Manage Tickets</h3>
                  <p className="text-sm text-gray-600">View and manage store tickets</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-green-200" onClick={() => router.push('/moderator/analytics')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Analytics</h3>
                  <p className="text-sm text-gray-600">View detailed store analytics</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-purple-200" onClick={() => router.push('/moderator')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Dashboard</h3>
                  <p className="text-sm text-gray-600">Return to main dashboard</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="Total Tickets"
            value={metrics.totalTickets}
            icon={Ticket}
            color="blue"
          />
          <MetricsCard
            title="Open Issues"
            value={metrics.openTickets}
            icon={AlertTriangle}
            color="red"
            description="Requires attention"
          />
          <MetricsCard
            title="In Progress"
            value={metrics.inProgressTickets}
            icon={TrendingUp}
            color="yellow"
            description="Being resolved"
          />
          <MetricsCard
            title="SLA Compliance"
            value={`${metrics.slaCompliance}%`}
            icon={Target}
            color="green"
            description="Performance score"
          />
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Completed Tickets</p>
                  <p className="text-2xl font-bold text-blue-800">{metrics.completedTickets}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Rejected Tickets</p>
                  <p className="text-2xl font-bold text-orange-800">{metrics.rejectedTickets}</p>
                </div>
                <UserX className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Pending Approvals</p>
                  <p className="text-2xl font-bold text-purple-800">{pendingProviders.length}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Store Information */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Store Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Store className="h-5 w-5 text-blue-600" />
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Store Name</Label>
                    <p className="text-lg font-semibold text-blue-900">{store.name}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Store ID</Label>
                    <p className="font-semibold">{store.store_id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <Badge variant={store.status === 'APPROVED' ? 'default' : 'secondary'}>
                      {store.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Address</Label>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {store.address}, {store.city}, {store.state} {store.zip_code}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Created</Label>
                    <p className="text-sm">{new Date(store.created_at).toLocaleDateString()}</p>
                  </div>
                  {store.approved_at && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Approved</Label>
                      <p className="text-sm">{new Date(store.approved_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Provider Approvals */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-purple-600" />
                Pending Service Provider Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {actionMsg && (
                <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg border border-green-200">
                  {actionMsg}
                </div>
              )}
              
              {pendingProviders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No pending service provider approvals.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingProviders.map((provider: any) => (
                    <div key={provider.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{provider.username}</h4>
                          <p className="text-sm text-gray-600">{provider.email}</p>
                          {provider.service_provider && (
                            <div className="mt-2 space-y-1">
                              <p className="text-xs text-gray-500">
                                <span className="font-medium">Company:</span> {provider.service_provider.company_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                <span className="font-medium">Skills:</span> {provider.service_provider.skills?.join(', ')}
                              </p>
                              <p className="text-xs text-gray-500">
                                <span className="font-medium">Capacity:</span> {provider.service_provider.capacity_per_day} tickets/day
                              </p>
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            Registered: {new Date(provider.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => handleProviderAction(provider.id, 'APPROVE')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleProviderAction(provider.id, 'REJECT')}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Recent Store Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity: any) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.type === 'escalation' ? 'bg-orange-500' :
                        activity.type === 'remark' ? 'bg-blue-500' :
                        activity.status === 'OPEN' ? 'bg-red-500' :
                        activity.status === 'IN_PROGRESS' ? 'bg-yellow-500' :
                        activity.status === 'COMPLETED' ? 'bg-green-500' :
                        activity.status === 'REJECTED_BY_TECH' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`} />
                      <div>
                        <h4 className="font-medium text-gray-900">{activity.description}</h4>
                        <p className="text-sm text-gray-600">
                          {activity.type === 'escalation' ? (
                            `Escalated to ${activity.escalated_to?.username || 'Unknown'} • ${new Date(activity.created_at).toLocaleDateString()}`
                          ) : activity.type === 'remark' ? (
                            `By ${activity.user?.username || 'Unknown'} (${activity.user?.role}) • ${new Date(activity.created_at).toLocaleDateString()}`
                          ) : (
                            `Reported by ${activity.reporter?.username || 'Unknown'} • ${new Date(activity.created_at).toLocaleDateString()}`
                          )}
                        </p>
                        {activity.type === 'ticket_created' && activity.assigned_provider && (
                          <p className="text-xs text-blue-600">
                            Assigned to {activity.assigned_provider.company_name}
                          </p>
                        )}
                        {activity.type === 'remark' && (
                          <p className="text-xs text-gray-500">
                            Ticket: {activity.ticket_description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        activity.type === 'escalation' ? 'destructive' :
                        activity.type === 'remark' ? 'secondary' :
                        activity.status === 'OPEN' ? 'destructive' :
                        activity.status === 'IN_PROGRESS' ? 'secondary' :
                        activity.status === 'COMPLETED' ? 'default' :
                        'outline'
                      }>
                        {activity.type === 'escalation' ? 'ESCALATED' :
                         activity.type === 'remark' ? 'REMARK' :
                         activity.status}
                      </Badge>
                      {activity.type === 'ticket_created' && activity.priority && (
                        <Badge variant={
                          activity.priority === 'HIGH' ? 'destructive' :
                          activity.priority === 'MEDIUM' ? 'secondary' :
                          'default'
                        }>
                          {activity.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tickets */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-orange-600" />
              Recent Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTickets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No tickets found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTickets.slice(0, 5).map((ticket: any) => (
                  <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        ticket.status === 'OPEN' ? 'bg-red-500' :
                        ticket.status === 'IN_PROGRESS' ? 'bg-yellow-500' :
                        ticket.status === 'COMPLETED' ? 'bg-green-500' :
                        ticket.status === 'REJECTED_BY_TECH' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`} />
                      <div>
                        <h4 className="font-medium text-gray-900">{ticket.description}</h4>
                        <p className="text-sm text-gray-600">
                          {ticket.location_in_store} • {ticket.ai_classification_category}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        ticket.ai_priority === 'HIGH' ? 'destructive' :
                        ticket.ai_priority === 'MEDIUM' ? 'secondary' :
                        'default'
                      }>
                        {ticket.ai_priority}
                      </Badge>
                      <Badge variant="outline">
                        {ticket.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}