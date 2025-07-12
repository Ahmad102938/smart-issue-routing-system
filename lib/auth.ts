import { User } from '@/types';
import { mockUsers } from './mockData';

// Simple auth context for demo purposes
let currentUser: User | null = null;

export const login = async (username: string, password: string): Promise<User | null> => {
  // Mock authentication - in production, this would call a secure API
  const user = mockUsers.find(u => u.username === username && u.is_active);
  
  if (user && password === 'password123') { // Mock password check
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  }
  
  return null;
};

export const logout = () => {
  currentUser = null;
  localStorage.removeItem('currentUser');
};

export const getCurrentUser = (): User | null => {
  if (currentUser) return currentUser;
  
  // Try to get from localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        currentUser = JSON.parse(stored);
        return currentUser;
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }
  
  return null;
};

export const hasRole = (requiredRole: string): boolean => {
  const user = getCurrentUser();
  return user?.role === requiredRole;
};

export const canAccess = (allowedRoles: string[]): boolean => {
  const user = getCurrentUser();
  return user ? allowedRoles.includes(user.role) : false;
};