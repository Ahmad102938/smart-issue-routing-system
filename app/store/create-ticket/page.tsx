'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateTicketForm from '@/components/tickets/CreateTicketForm';

export default function CreateTicketPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('Create ticket page - Session:', session, 'Status:', status);
    
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
    
    console.log('User is store register, proceeding to create ticket');
  }, [session, status, router]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
    <DashboardLayout title="Create New Ticket">
      <CreateTicketForm />
    </DashboardLayout>
  );
}