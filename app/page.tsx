'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import { getCurrentUser } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      // Redirect based on role
      switch (user.role) {
        case 'store_register':
          router.push('/store');
          break;
        case 'service_provider':
          router.push('/technician');
          break;
        case 'admin':
          router.push('/admin');
          break;
        case 'moderator':
          router.push('/moderator');
          break;
        default:
          break;
      }
    }
  }, [router]);

  return <LoginForm />;
}