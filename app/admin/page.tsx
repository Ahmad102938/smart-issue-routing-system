'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MetricsCard from '@/components/dashboard/MetricsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, 
  Users, 
  Ticket, 
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { mockStores, mockServiceProviders, mockTickets } from '@/lib/mockData';

export default function AdminDashboard() {
  const router = useRouter();
  const user = getCurrentUser();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
    }
  }, [user, router]);

  const totalStores = mockStores.length;
  const approvedStores = mockStores.filter(s => s.status === 'approved').length;
  const totalProviders = mockServiceProviders.length;
  const approvedProviders = mockServiceProviders.filter(p => p.status === 'approved').length;
  const totalTickets = mockTickets.length;
  const openTickets = mockTickets.filter(t => t.status === 'open').length;
  const inProgressTickets = mockTickets.filter(t => t.status === 'in_progress').length;
  const completedTickets = mockTickets.filter(t => t.status === 'completed').length;

  // Mock analytics data
  const categoryData = [
    { name: 'Facilities', value: 45, color: '#3B82F6' },
    { name: 'IT', value: 30, color: '#10B981' },
    { name: 'Equipment', value: 25, color: '#F59E0B' }
  ];

  const priorityData = [
    { name: 'High', value: 20, color: '#EF4444' },
    { name: 'Medium', value: 50, color: '#F59E0B' },
    { name: 'Low', value: 30, color: '#10B981' }
  ];

  if (!user) return null;

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Overview</h1>
          <p className="text-gray-600 mt-1">
            Global monitoring and management across all stores
          </p>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="Total Stores"
            value={totalStores}
            description={`${approvedStores} approved`}
            icon={Building2}
            color="blue"
          />
          <MetricsCard
            title="Service Providers"
            value={totalProviders}
            description={`${approvedProviders} active`}
            icon={Users}
            color="green"
          />
          <MetricsCard
            title="Total Tickets"
            value={totalTickets}
            icon={Ticket}
            color="purple"
            trend={{ value: 8, isPositive: true }}
          />
          <MetricsCard
            title="SLA Compliance"
            value="94.2%"
            icon={TrendingUp}
            color="green"
            trend={{ value: 2.1, isPositive: true }}
          />
        </div>

        {/* Ticket Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricsCard
            title="Open Tickets"
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
            color="blue"
          />
          <MetricsCard
            title="Completed"
            value={completedTickets}
            description="Successfully resolved"
            icon={CheckCircle2}
            color="green"
          />
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Issues by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Issues by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full"
                          style={{ 
                            width: `${item.value}%`,
                            backgroundColor: item.color 
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8">{item.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Issues by Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Issues by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {priorityData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium">{item.name} Priority</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full"
                          style={{ 
                            width: `${item.value}%`,
                            backgroundColor: item.color 
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8">{item.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>System Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm">New store registration: Austin Neighborhood Market</span>
                <span className="text-xs text-gray-500 ml-auto">2 hours ago</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">Service provider approved: Quick Fix Solutions</span>
                <span className="text-xs text-gray-500 ml-auto">4 hours ago</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-sm">SLA breach alert: Ticket #123 exceeded deadline</span>
                <span className="text-xs text-gray-500 ml-auto">6 hours ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}