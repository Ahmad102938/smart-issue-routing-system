'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Users,
  Building2,
  Ticket,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Loader2
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, AreaChart, Area
} from 'recharts';

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [timeRange, setTimeRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    
    if (session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/stats?range=${timeRange}`);
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        const data = await response.json();
        setAnalyticsData(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === 'ADMIN') {
      fetchAnalytics();
    }
  }, [session, timeRange]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Loading Analytics...</h1>
          <p className="text-gray-600">Please wait while we load your analytics dashboard.</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
    return null;
  }

  const stats = analyticsData?.stats || {};
  const charts = analyticsData?.charts || {};

  const getSLAStatus = (sla: number) => {
    if (sla >= 95) return { color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200', icon: CheckCircle2 };
    if (sla >= 85) return { color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200', icon: AlertTriangle };
    return { color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200', icon: XCircle };
  };

  const slaStatus = getSLAStatus(stats.slaCompliance || 0);
  const SLAIcon = slaStatus.icon;

  return (
    <DashboardLayout title="Analytics Dashboard">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Comprehensive insights and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading analytics data...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Analytics</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                  <Ticket className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.totalTickets || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.openTickets || 0} open, {stats.completedTickets || 0} completed
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
                  <SLAIcon className={`h-4 w-4 ${slaStatus.color}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${slaStatus.color}`}>
                    {stats.slaCompliance || 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {slaStatus.color.includes('green') ? 'Excellent' : slaStatus.color.includes('yellow') ? 'Good' : 'Needs attention'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Stores</CardTitle>
                  <Building2 className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{stats.approvedStores || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalStores || 0} total stores
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Service Providers</CardTitle>
                  <Users className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.approvedProviders || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalProviders || 0} total providers
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Ticket Status Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Ticket Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {charts.statusData && charts.statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={charts.statusData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No status data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Issues by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {charts.categoryData && charts.categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={charts.categoryData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {charts.categoryData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color || '#6B7280'} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No category data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Ticket Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {charts.ticketTrendData && charts.ticketTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={charts.ticketTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="tickets" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No trend data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    SLA Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {charts.slaData && charts.slaData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={charts.slaData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[80, 100]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="sla" stroke="#10B981" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No SLA data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Detailed Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Ticket Status Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Open</span>
                    <Badge variant="secondary">{stats.openTickets || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">In Progress</span>
                    <Badge variant="secondary">{stats.inProgressTickets || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Completed</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {stats.completedTickets || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Rejected</span>
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      {stats.rejectedTickets || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Escalated</span>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      {stats.escalatedTickets || 0}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Priority Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {charts.priorityData && charts.priorityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <RechartsPieChart>
                        <Pie
                          data={charts.priorityData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {charts.priorityData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color || '#6B7280'} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No priority data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Provider Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {charts.techPerformanceData && charts.techPerformanceData.length > 0 ? (
                    <div className="space-y-3">
                      {charts.techPerformanceData.slice(0, 5).map((provider: any, index: number) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm truncate">{provider.name}</span>
                          <Badge variant="outline">{provider.completed} completed</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No performance data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Avg Response Time</p>
                      <p className="text-2xl font-bold text-blue-800">2.4h</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-50 to-green-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Resolution Rate</p>
                      <p className="text-2xl font-bold text-green-800">94.2%</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Customer Satisfaction</p>
                      <p className="text-2xl font-bold text-purple-800">4.8/5</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Active Issues</p>
                      <p className="text-2xl font-bold text-orange-800">{stats.openTickets || 0}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
} 