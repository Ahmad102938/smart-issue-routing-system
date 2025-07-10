import { UserRole } from '@prisma/client';
import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      email: string;
      role: UserRole;
      associated_entity_id?: string;
      store?: any;
      service_provider?: any;
    };
  }

  interface User {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    associated_entity_id?: string;
    store?: any;
    service_provider?: any;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    associated_entity_id?: string;
    store?: any;
    service_provider?: any;
  }
}