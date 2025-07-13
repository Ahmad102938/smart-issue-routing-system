import { UserRole } from '@prisma/client';
import NextAuth from 'next-auth';
import type { Store, ServiceProvider } from './index';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      email: string;
      role: UserRole;
      associated_store_id?: string;
      associated_provider_id?: string;
      store?: Store;
      service_provider?: ServiceProvider;
    };
  }

  interface User {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    associated_store_id?: string;
    associated_provider_id?: string;
    store?: Store;
    service_provider?: ServiceProvider;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    associated_store_id?: string;
    associated_provider_id?: string;
    store?: Store;
    service_provider?: ServiceProvider;
  }
}