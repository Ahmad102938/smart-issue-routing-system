'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TicketList from '@/components/tickets/TicketList';
import TicketDetail from '@/components/tickets/TicketDetail';
import { Ticket } from '@/types';

export default function StoreTicketsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    console.log('Store tickets page - Session:', session, 'Status:', status);
    
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
    
    console.log('User is store register, proceeding to tickets page');
  }, [session, status, router]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tickets...</p>
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
    <DashboardLayout title="My Tickets">
      {selectedTicket ? (
        <TicketDetail 
          ticket={selectedTicket} 
          onBack={() => setSelectedTicket(null)} 
        />
      ) : (
        <TicketList 
          onTicketSelect={setSelectedTicket}
        />
      )}
    </DashboardLayout>
  );
}