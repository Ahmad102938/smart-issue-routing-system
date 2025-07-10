'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MetricsCard from '@/components/dashboard/MetricsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Ticket, 
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  UserCheck
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { mockTickets, mockServiceProviders, mockStores } from '@/lib/mockData';

export default function ModeratorDashboard() {
  const router = useRouter();
  const user = getCurrentUser();

  // Get store for this moderator
  const myStore = mockStores.find(s => s.moderator_user_id === user?.id);
  
  // Filter data for this store
  const storeTickets = mockTickets.filter(t => t.store_id === myStore?.id);
  const storeProviders = mockServiceProviders.filter(p => 
    p.approved_by_moderator_id === user?.id || p.status === 'pending_approval'
  );

  const openTickets = storeTickets.filter(t => t.status === 'open').length;
  const inProgressTickets = storeTickets.filter(t => t.status === 'in_progress').length;
  const completedTickets = storeTickets.filter(t => t.status === 'completed').length;
  const pendingProviders = storeProviders.filter(p => p.status === 'pending_approval').length;

  useEffect(() => {
    if (!user || user.role !== 'moderator') {
      router.push('/');
    }
  }, [user, router]);

  if (!user || !myStore) return null;

  return (
    <DashboardLayout title="Moderator Dashboard">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store Management</h1>
          <p className="text-gray-600 mt-1">
            {myStore.name} - Store ID: {myStore.store_id}
          </p>
        </div>

        {/* Store Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="Store Tickets"
            value={storeTickets.length}
            icon={Ticket}
            color="blue"
            trend={{ value: 15, isPositive: true }}
          />
          <MetricsCard
            title="Open Issues"
            value={openTickets}
            description="Awaiting assignment"
            icon={AlertTriangle}
            color="yellow"
          />
          <MetricsCard
            title="In Progress"
            value={inProgressTickets}
            description="Being resolved"
            icon={Clock}
            color="purple"
          />
          <MetricsCard
            title="Completed"
            value={completedTickets}
            description="Successfully resolved"
            icon={CheckCircle2}
            color="green"
          />
        </div>

        {/* Provider Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Service Providers
              </CardTitle>
              {pendingProviders > 0 && (
                <Badge variant="destructive">{pendingProviders} pending</Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {storeProviders.slice(0, 5).map((provider) => (
                  <div key={provider.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{provider.company_name}</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {provider.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={provider.status === 'approved' ? 'default' : 'secondary'}
                        className={provider.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {provider.status === 'pending_approval' ? 'Pending' : 'Approved'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button variant="outline" className="w-full mt-4">
                <UserCheck className="h-4 w-4 mr-2" />
                Manage Providers
              </Button>
            </CardContent>
          </Card>

          {/* Store Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Store Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">SLA Compliance</span>
                    <span className="text-sm font-semibold text-green-600">96.5%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '96.5%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Avg. Resolution Time</span>
                    <span className="text-sm font-semibold">4.2 hours</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '70%' }} />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-green-600 font-medium">
                    ↑ 8% improvement this month
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Compared to previous period
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Store Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Store Activity</CardTitle>
            <Button variant="outline" onClick={() => router.push('/moderator/tickets')}>
              <Eye className="h-4 w-4 mr-2" />
              View All Tickets
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {storeTickets.slice(0, 5).map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">#{ticket.id}</span>
                      <Badge variant="outline" className={
                        ticket.ai_priority === 'high' ? 'border-red-200 text-red-800' :
                        ticket.ai_priority === 'medium' ? 'border-yellow-200 text-yellow-800' :
                        'border-green-200 text-green-800'
                      }>
                        {ticket.ai_priority.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className={
                        ticket.status === 'completed' ? 'border-green-200 text-green-800' :
                        ticket.status === 'in_progress' ? 'border-yellow-200 text-yellow-800' :
                        'border-blue-200 text-blue-800'
                      }>
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