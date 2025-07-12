'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MetricsCard from '@/components/dashboard/MetricsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Ticket, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Settings,
  Briefcase,
  TrendingUp,
  Eye
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { mockTickets, mockServiceProviders } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

export default function TechnicianDashboard() {
  const router = useRouter();
  const user = getCurrentUser();
  const [capacity, setCapacity] = useState(5);
  const { toast } = useToast();
  
  // Get current service provider from user data or mock data
  const serviceProvider = user?.service_provider || mockServiceProviders.find(p => p.id === user?.associated_provider_id);
  
  // Filter tickets for this technician
  const myTickets = mockTickets.filter(t => t.assigned_service_provider_id === user?.associated_provider_id || user?.service_provider?.id);
  const inProgressTickets = myTickets.filter(t => t.status === 'in_progress');
  const completedToday = myTickets.filter(t => 
    t.status === 'completed' && 
    new Date(t.completed_at || '').toDateString() === new Date().toDateString()
  );

  // Load capacity from localStorage if available
  useEffect(() => {
    const stored = localStorage.getItem('technician_capacity');
    if (stored) setCapacity(Number(stored));
  }, []);

  const [pendingCapacity, setPendingCapacity] = useState(capacity);

  const handleCapacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPendingCapacity(Number(e.target.value));
  };

  const handleUpdateCapacity = () => {
    setCapacity(pendingCapacity);
    localStorage.setItem('technician_capacity', String(pendingCapacity));
    toast({
      title: 'Capacity Updated',
      description: `Your daily capacity is now set to ${pendingCapacity} tickets.`,
    });
  };

  useEffect(() => {
    console.log('Technician page - Current user:', user);
    console.log('Technician page - Service provider:', serviceProvider);
    
    if (!user) {
      console.log('No user found, redirecting to signin');
      router.push('/auth/signin');
      return;
    }
    
    if (user.role !== 'SERVICE_PROVIDER') {
      console.log('User is not service provider, redirecting to home');
      router.push('/');
      return;
    }
    
    console.log('User is service provider, proceeding to dashboard');
  }, [user, router, serviceProvider]);

  const handleViewTickets = () => {
    router.push('/technician/tickets');
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/auth/signin');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p>Please wait while we load your dashboard.</p>
        </div>
      </div>
    );
  }

  if (!serviceProvider) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Service Provider Not Found</h1>
          <p>Unable to load your service provider information.</p>
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
    <DashboardLayout title="Technician Dashboard">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Technician Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {serviceProvider.company_name}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleViewTickets}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
            >
              <Eye className="h-4 w-4 mr-2" />
              View All Tickets
            </Button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="Total Assignments"
            value={myTickets.length}
            icon={Ticket}
            color="blue"
          />
          <MetricsCard
            title="In Progress"
            value={inProgressTickets.length}
            icon={Clock}
            color="yellow"
            description="Active repairs"
          />
          <MetricsCard
            title="Completed Today"
            value={completedToday.length}
            icon={CheckCircle2}
            color="green"
            trend={{ value: 15, isPositive: true }}
          />
          <MetricsCard
            title="Current Load"
            value={`${serviceProvider.current_load}/${serviceProvider.capacity_per_day}`}
            icon={Briefcase}
            color="purple"
            description="Capacity utilization"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Capacity Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Capacity Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Daily Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={pendingCapacity}
                  onChange={handleCapacityChange}
                  min="1"
                  max="20"
                />
                <p className="text-xs text-gray-500">
                  Maximum tickets you can handle per day
                </p>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm mb-2">
                  <span>Current Utilization</span>
                  <span>{Math.round((serviceProvider.current_load / serviceProvider.capacity_per_day) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, (serviceProvider.current_load / serviceProvider.capacity_per_day) * 100)}%` }}
                  />
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleUpdateCapacity}
                disabled={pendingCapacity === capacity}
              >
                Update Capacity
              </Button>
            </CardContent>
          </Card>

          {/* Skills & Expertise */}
          <Card>
            <CardHeader>
              <CardTitle>Skills & Expertise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {serviceProvider.skills.map((skill: string) => (
                  <Badge key={skill} variant="outline" className="border-emerald-200 text-emerald-700">
                    {skill}
                  </Badge>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t text-sm text-gray-600">
                <p><strong>Service Area:</strong> Dallas Metro</p>
                <p><strong>Company ID:</strong> {serviceProvider.unique_company_id}</p>
              </div>
            </CardContent>
          </Card>

          {/* Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg. Resolution</span>
                  <span className="font-semibold">3.2 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-semibold text-green-600">98.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer Rating</span>
                  <span className="font-semibold">4.9/5.0</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-xs text-green-600 font-medium">
                    ↑ +12% improvement this month
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Assignments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Assignments</CardTitle>
            <Button variant="outline" onClick={handleViewTickets}>
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myTickets.slice(0, 5).map((ticket) => (
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