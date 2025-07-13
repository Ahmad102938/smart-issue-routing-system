'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, TrendingUp, AlertTriangle, CheckCircle, XCircle, Users, MapPin, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface StoreAnalytics {
  store: {
    id: string;
    name: string;
    store_id: string;
    address: string;
    city: string;
    state: string;
    status: string;
  };
  overview: {
    totalTickets: number;
    openTickets: number;
    completedTickets: number;
    rejectedTickets: number;
    averageResolutionTime: number;
    slaComplianceRate: number;
  };
  ticketTrends: Array<{
    date: string;
    opened: number;
    completed: number;
    rejected: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  priorityDistribution: Array<{
    priority: string;
    count: number;
    percentage: number;
  }>;
  slaMetrics: {
    onTime: number;
    late: number;
    critical: number;
    averageTime: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    timestamp: string;
    description: string;
  }>;
  topIssues: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
}

const COLORS = {
  OPEN: '#3b82f6',
  ASSIGNED: '#8b5cf6',
  IN_PROGRESS: '#f59e0b',
  REJECTED_BY_TECH: '#ef4444',
  ESCALATED: '#dc2626',
  PENDING_APPROVAL: '#f97316',
  COMPLETED: '#10b981',
  CLOSED: '#6b7280',
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#10b981',
};

const getStatusColor = (status: string) => {
  return COLORS[status as keyof typeof COLORS] || '#6b7280';
};

const getPriorityColor = (priority: string) => {
  return COLORS[priority as keyof typeof COLORS] || '#6b7280';
};

const formatTime = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export default function ModeratorAnalytics() {
  const { data: session, status } = useSession();
  const [analytics, setAnalytics] = useState<StoreAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    fetchAnalytics();
  }, [session, status, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/moderator/analytics?timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout title="Store Analytics">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !analytics) {
    return (
      <DashboardLayout title="Store Analytics">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Analytics</h2>
          <p className="text-gray-600">{error || 'Failed to load analytics data'}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Store Analytics">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Store Analytics</h1>
              <p className="text-gray-600 mt-1">
                Comprehensive insights for <span className="font-semibold text-blue-600">{analytics.store.name}</span>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-sm">
                <MapPin className="w-4 h-4 mr-1" />
                {analytics.store.city}, {analytics.store.state}
              </Badge>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.overview.totalTickets}</div>
              <div className="text-xs opacity-90 mt-1">All time</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Open Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.overview.openTickets}</div>
              <div className="text-xs opacity-90 mt-1">Currently active</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">SLA Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.overview.slaComplianceRate}%</div>
              <div className="text-xs opacity-90 mt-1">On-time resolution</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Avg Resolution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatTime(analytics.overview.averageResolutionTime)}</div>
              <div className="text-xs opacity-90 mt-1">Time to complete</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ticket Trends Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Ticket Trends
                  </CardTitle>
                  <CardDescription>Ticket volume over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.ticketTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="opened" stroke="#3b82f6" strokeWidth={2} name="Opened" />
                      <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
                      <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} name="Rejected" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Status Distribution
                  </CardTitle>
                  <CardDescription>Current ticket status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, percentage }) => `${status}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analytics.statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* SLA Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  SLA Performance
                </CardTitle>
                <CardDescription>Service Level Agreement metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{analytics.slaMetrics.onTime}</div>
                    <div className="text-sm text-gray-600">On Time</div>
                    <Progress value={(analytics.slaMetrics.onTime / (analytics.slaMetrics.onTime + analytics.slaMetrics.late)) * 100} className="mt-2" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{analytics.slaMetrics.late}</div>
                    <div className="text-sm text-gray-600">Late</div>
                    <Progress value={(analytics.slaMetrics.late / (analytics.slaMetrics.onTime + analytics.slaMetrics.late)) * 100} className="mt-2" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{analytics.slaMetrics.critical}</div>
                    <div className="text-sm text-gray-600">Critical</div>
                    <Progress value={(analytics.slaMetrics.critical / (analytics.slaMetrics.onTime + analytics.slaMetrics.late)) * 100} className="mt-2" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{formatTime(analytics.slaMetrics.averageTime)}</div>
                    <div className="text-sm text-gray-600">Avg Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Priority Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Priority Distribution</CardTitle>
                  <CardDescription>Ticket priority breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.priorityDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="priority" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8">
                        {analytics.priorityDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getPriorityColor(entry.priority)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Issues */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Issue Categories</CardTitle>
                  <CardDescription>Most common problem types</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.topIssues.map((issue, index) => (
                      <div key={issue.category} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{issue.category}</div>
                            <div className="text-sm text-gray-500">{issue.count} tickets</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{issue.percentage}%</div>
                          <Progress value={issue.percentage} className="w-20 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Resolution Rate</span>
                      <span className="text-sm font-bold text-green-600">
                        {((analytics.overview.completedTickets / analytics.overview.totalTickets) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={(analytics.overview.completedTickets / analytics.overview.totalTickets) * 100} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Rejection Rate</span>
                      <span className="text-sm font-bold text-red-600">
                        {((analytics.overview.rejectedTickets / analytics.overview.totalTickets) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={(analytics.overview.rejectedTickets / analytics.overview.totalTickets) * 100} />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">SLA Compliance</span>
                      <span className="text-sm font-bold text-blue-600">{analytics.overview.slaComplianceRate}%</span>
                    </div>
                    <Progress value={analytics.overview.slaComplianceRate} />
                  </div>
                </CardContent>
              </Card>

              {/* Store Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Store Information</CardTitle>
                  <CardDescription>Current store details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Store ID</span>
                      <Badge variant="outline">{analytics.store.store_id}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status</span>
                      <Badge variant={analytics.store.status === 'APPROVED' ? 'default' : 'secondary'}>
                        {analytics.store.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Address</span>
                      <span className="text-sm text-gray-600">{analytics.store.address}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Location</span>
                      <span className="text-sm text-gray-600">{analytics.store.city}, {analytics.store.state}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest ticket activities and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{activity.action}</span>
                          <span className="text-sm text-gray-500">{activity.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 