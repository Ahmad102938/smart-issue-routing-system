'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TicketList from '@/components/tickets/TicketList';
import TicketDetail from '@/components/tickets/TicketDetail';
import { Ticket } from '@/types';

export default function AdminTicketsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

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

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Loading...</h1>
          <p className="text-gray-600">Please wait while we verify your access.</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <DashboardLayout title="All Tickets">
      {selectedTicket ? (
        <TicketDetail 
          ticket={selectedTicket} 
          onBack={() => setSelectedTicket(null)} 
        />
      ) : (
        <TicketList onTicketSelect={setSelectedTicket} />
      )}
    </DashboardLayout>
  );
}