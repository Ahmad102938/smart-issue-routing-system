'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, 
  Filter, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Eye,
  User,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Ticket } from '@/types';

interface TicketListProps {
  onTicketSelect?: (ticket: Ticket) => void;
}

export default function TicketList({ onTicketSelect }: TicketListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 10;
  const { data: session } = useSession();

  // Fetch tickets from API
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tickets');
        if (!response.ok) {
          throw new Error('Failed to fetch tickets');
        }
        const data = await response.json();
        console.log('Fetched tickets:', data);
        setTickets(data);
      } catch (err) {
        console.error('Error fetching tickets:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch tickets');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchTickets();
    }
  }, [session]);

  // Filter tickets based on search and filters
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.id.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || ticket.status.toLowerCase() === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.ai_priority.toLowerCase() === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);
  const startIndex = (currentPage - 1) * ticketsPerPage;
  const endIndex = startIndex + ticketsPerPage;
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter]);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <Clock className="h-4 w-4" />;
      case 'ASSIGNED': return <User className="h-4 w-4" />;
      case 'IN_PROGRESS': return <AlertTriangle className="h-4 w-4" />;
      case 'COMPLETED': return <CheckCircle2 className="h-4 w-4" />;
      case 'REJECTED_BY_TECH': return <XCircle className="h-4 w-4" />;
      case 'ESCALATED': return <AlertTriangle className="h-4 w-4" />;
      case 'PENDING_APPROVAL': return <Clock className="h-4 w-4" />;
      case 'CLOSED': return <CheckCircle2 className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED_BY_TECH': return 'bg-red-100 text-red-800 border-red-200';
      case 'ESCALATED': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'PENDING_APPROVAL': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CLOSED': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAssignedProvider = (providerId?: string) => {
    // Find provider from the ticket's assigned_provider data
    return null; // Will be handled by the API response
  };

  const getStore = (storeId: string) => {
    // Find store from the ticket's store data
    return null; // Will be handled by the API response
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {session?.user?.role === 'SERVICE_PROVIDER' ? 'My Assignments' : 'Tickets'}
            </h1>
            <p className="text-gray-600">Loading tickets...</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading tickets...</h3>
            <p className="text-gray-500">Please wait while we fetch your tickets</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {session?.user?.role === 'SERVICE_PROVIDER' ? 'My Assignments' : 'Tickets'}
            </h1>
            <p className="text-gray-600">Error loading tickets</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading tickets</h3>
            <p className="text-gray-500">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {session?.user?.role === 'SERVICE_PROVIDER' ? 'My Assignments' : 'Tickets'}
          </h1>
          <p className="text-gray-600">
            {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by ticket ID or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected_by_tech">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Grid */}
      <div className="grid gap-4">
        {paginatedTickets.map((ticket) => {
          const store = ticket.store;
          const provider = ticket.assigned_provider;
          
          return (
            <Card 
              key={ticket.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onTicketSelect?.(ticket)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Left Section - Ticket Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">#{ticket.id}</h3>
                          <Badge className={getPriorityColor(ticket.ai_priority)}>
                            {ticket.ai_priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(ticket.status)}>
                            {getStatusIcon(ticket.status)}
                            <span className="ml-1 capitalize">{ticket.status.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        
                        <p className="text-gray-700 mb-2 line-clamp-2">
                          {ticket.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                          <span>📍 {ticket.location_in_store}</span>
                          {store && session?.user?.role !== 'STORE_REGISTER' && (
                            <span>🏪 {store.name}</span>
                          )}
                          <span>🏷️ {ticket.ai_classification_category} - {ticket.ai_classification_subcategory}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Assignment & Actions */}
                  <div className="lg:w-80 space-y-3">
                    <div className="text-sm text-gray-500">
                      Created: {formatDate(ticket.created_at)}
                    </div>
                    
                    {provider && (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700">
                            {provider.company_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {provider.company_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Assigned Technician
                          </p>
                        </div>
                      </div>
                    )}

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTicketSelect?.(ticket);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredTickets.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'No tickets have been created yet'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination Controls */}
      {filteredTickets.length > ticketsPerPage && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredTickets.length)} of {filteredTickets.length} tickets
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}