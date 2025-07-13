import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            username: credentials.username,
            is_active: true
          },
          include: {
            store: true,
            service_provider: true
          }
        });

        if (!user) {
          return null;
        }

        // If force_password_change is true, check temp_password_hash
        if (user.force_password_change && user.temp_password_hash) {
          const isTempPasswordValid = await bcrypt.compare(
            credentials.password,
            user.temp_password_hash
          );
          if (!isTempPasswordValid) {
            // Only allow login with temp password
            return null;
          }
          // Allow login, but indicate password change is required
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            associated_store_id: user.associated_store_id || '',
            associated_provider_id: user.associated_provider_id || '',
            store: user.store,
            service_provider: user.service_provider,
            force_password_change: true as boolean
          };
        }

        // Normal password check
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          associated_store_id: user.associated_store_id || '',
          associated_provider_id: user.associated_provider_id || '',
          store: user.store,
          service_provider: user.service_provider,
          force_password_change: false as boolean
        };
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.associated_store_id = user.associated_store_id;
        token.associated_provider_id = user.associated_provider_id;
        token.store = user.store;
        token.service_provider = user.service_provider;
        (token as any).force_password_change = (user as any).force_password_change;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.associated_store_id = token.associated_store_id as string;
        session.user.associated_provider_id = token.associated_provider_id as string;
        session.user.store = token.store;
        session.user.service_provider = token.service_provider;
        (session.user as any).force_password_change = (token as any).force_password_change;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  events: {
    async signOut({ token }) {
      // Clear any stored session data
      console.log('User signed out:', token?.sub);
    }
  }
};