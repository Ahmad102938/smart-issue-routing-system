'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';

export default function DebugAdminPage() {
  const [user, setUser] = useState<any>(null);
  const [localStorageData, setLocalStorageData] = useState<string>('');

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('currentUser');
      setLocalStorageData(stored || 'No data in localStorage');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-2xl w-full space-y-4">
        <h1 className="text-2xl font-bold text-center">Admin Debug Page</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Current User (from getCurrentUser):</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">localStorage Data:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {localStorageData}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Navigation:</h2>
          <div className="space-y-2">
            <a 
              href="/admin" 
              className="block w-full bg-blue-500 text-white p-3 rounded text-center hover:bg-blue-600"
            >
              Go to Admin Dashboard
            </a>
            <a 
              href="/auth/signin" 
              className="block w-full bg-green-500 text-white p-3 rounded text-center hover:bg-green-600"
            >
              Go to Signin Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 