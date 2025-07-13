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
  Eye,
  Loader2
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';

interface Ticket {
  id: string;
  description: string;
  status: string;
  ai_priority: string;
  location_in_store: string;
  ai_classification_category: string;
  created_at: string;
  completed_at?: string;
  assigned_service_provider_id?: string;
}

interface ServiceProvider {
  id: string;
  company_name: string;
  current_load: number;
  capacity_per_day: number;
  skills: string[];
  unique_company_id: string;
}

export default function TechnicianDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [capacity, setCapacity] = useState(5);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [serviceProvider, setServiceProvider] = useState<ServiceProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Load capacity from localStorage if available
  useEffect(() => {
    const stored = localStorage.getItem('technician_capacity');
    if (stored) setCapacity(Number(stored));
  }, []);

  const [pendingCapacity, setPendingCapacity] = useState(capacity);

  // Fetch real data
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.associated_provider_id) return;
      
      try {
        setLoading(true);
        
        // Fetch tickets for this technician
        const ticketsResponse = await fetch('/api/tickets');
        if (ticketsResponse.ok) {
          const ticketsData = await ticketsResponse.json();
          setTickets(ticketsData);
        }
        
        // Fetch service provider details
        const providerResponse = await fetch(`/api/service-providers/${session.user.associated_provider_id}`);
        if (providerResponse.ok) {
          const providerData = await providerResponse.json();
          setServiceProvider(providerData);
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchData();
    }
  }, [session]);

  // Filter tickets for this technician
  const myTickets = tickets.filter(t => t.assigned_service_provider_id === session?.user?.associated_provider_id);
  const inProgressTickets = myTickets.filter(t => t.status === 'IN_PROGRESS');
  const completedToday = myTickets.filter(t => 
    t.status === 'COMPLETED' && 
    t.completed_at &&
    new Date(t.completed_at).toDateString() === new Date().toDateString()
  );

  const handleCapacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPendingCapacity(Number(e.target.value));
  };

  const handleUpdateCapacity = async () => {
    try {
      // Update capacity in the database
      const response = await fetch(`/api/service-providers/${session?.user?.associated_provider_id}/capacity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capacity: pendingCapacity })
      });
      
      if (response.ok) {
        setCapacity(pendingCapacity);
        localStorage.setItem('technician_capacity', String(pendingCapacity));
        toast({
          title: 'Capacity Updated',
          description: `Your daily capacity is now set to ${pendingCapacity} tickets.`,
        });
        
        // Refresh service provider data
        if (session?.user?.associated_provider_id) {
          const providerResponse = await fetch(`/api/service-providers/${session.user.associated_provider_id}`);
          if (providerResponse.ok) {
            const providerData = await providerResponse.json();
            setServiceProvider(providerData);
          }
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update capacity',
          variant: 'destructive'
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update capacity',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    console.log('Technician page - Session:', session, 'Status:', status);
    console.log('Technician page - Service provider:', serviceProvider);
    
    if (status === 'loading') {
      console.log('Session loading...');
      return;
    }
    
    if (!session?.user) {
      console.log('No session found, redirecting to signin');
      router.push('/auth/signin');
      return;
    }
    
    if (session.user.role !== 'SERVICE_PROVIDER') {
      console.log('User is not service provider, redirecting to home');
      router.push('/');
      return;
    }
    
    console.log('User is service provider, proceeding to dashboard');
  }, [session, status, router, serviceProvider]);

  const handleViewTickets = () => {
    router.push('/technician/tickets');
  };

  const handleLogout = () => {
    // Set flag to prevent auto-redirect after signout
    sessionStorage.setItem('justSignedOut', 'true');
    signOut({ callbackUrl: '/auth/signin' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading technician dashboard...</p>
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
  if (session.user.role !== 'SERVICE_PROVIDER') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Access denied. Redirecting...</p>
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
                {serviceProvider.skills && Array.isArray(serviceProvider.skills) && serviceProvider.skills.map((skill: string) => (
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
              
              {myTickets.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No assignments yet</p>
                  <p className="text-sm">New tickets will appear here when assigned to you</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}