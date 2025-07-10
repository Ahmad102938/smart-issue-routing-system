import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from './config';
import { NextRequest } from 'next/server';

export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export const PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.STORE_REGISTER]: [
    { resource: 'ticket', action: 'create' },
    { resource: 'ticket', action: 'read', conditions: { own_store: true } },
    { resource: 'ticket', action: 'update', conditions: { own_store: true, status: 'OPEN' } },
    { resource: 'profile', action: 'read' },
    { resource: 'profile', action: 'update' }
  ],
  [UserRole.SERVICE_PROVIDER]: [
    { resource: 'ticket', action: 'read', conditions: { assigned_to_self: true } },
    { resource: 'ticket', action: 'update', conditions: { assigned_to_self: true } },
    { resource: 'ticket', action: 'accept' },
    { resource: 'ticket', action: 'reject' },
    { resource: 'ticket', action: 'complete' },
    { resource: 'remark', action: 'create', conditions: { assigned_to_self: true } },
    { resource: 'profile', action: 'read' },
    { resource: 'profile', action: 'update' },
    { resource: 'capacity', action: 'update' }
  ],
  [UserRole.MODERATOR]: [
    { resource: 'ticket', action: 'read', conditions: { own_store: true } },
    { resource: 'ticket', action: 'update', conditions: { own_store: true } },
    { resource: 'service_provider', action: 'approve' },
    { resource: 'service_provider', action: 'reject' },
    { resource: 'service_provider', action: 'read' },
    { resource: 'analytics', action: 'read', conditions: { own_store: true } },
    { resource: 'profile', action: 'read' },
    { resource: 'profile', action: 'update' }
  ],
  [UserRole.ADMIN]: [
    { resource: '*', action: '*' } // Admin has all permissions
  ]
};

export async function hasPermission(
  userRole: UserRole,
  resource: string,
  action: string,
  context?: Record<string, any>
): Promise<boolean> {
  const userPermissions = PERMISSIONS[userRole];
  
  // Check for wildcard permission (admin)
  if (userPermissions.some(p => p.resource === '*' && p.action === '*')) {
    return true;
  }

  // Check for specific permission
  const permission = userPermissions.find(p => 
    (p.resource === resource || p.resource === '*') && 
    (p.action === action || p.action === '*')
  );

  if (!permission) {
    return false;
  }

  // Check conditions if they exist
  if (permission.conditions && context) {
    for (const [condition, value] of Object.entries(permission.conditions)) {
      if (context[condition] !== value) {
        return false;
      }
    }
  }

  return true;
}

export async function requireAuth(req?: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  return session.user;
}

export async function requirePermission(
  resource: string,
  action: string,
  context?: Record<string, any>
) {
  const user = await requireAuth();
  
  const allowed = await hasPermission(user.role, resource, action, context);
  
  if (!allowed) {
    throw new Error('Forbidden');
  }

  return user;
}