'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const handleRegister = (role: string) => {
    router.push(`/register/${role}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50 p-6">
      <h1 className="text-4xl font-bold mb-6 text-gray-900">Welcome to Smart Issue Management</h1>
      <p className="mb-10 text-gray-600 text-lg">Please select how you want to register:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
        <button
          className="p-8 rounded-xl shadow-lg bg-white hover:bg-blue-50 border border-blue-200 flex flex-col items-center transition"
          onClick={() => handleRegister('store')}
        >
          <span className="text-2xl font-semibold mb-2">Store</span>
          <span className="text-gray-500">Register as a Walmart Store</span>
        </button>
        <button
          className="p-8 rounded-xl shadow-lg bg-white hover:bg-green-50 border border-green-200 flex flex-col items-center transition"
          onClick={() => handleRegister('provider')}
        >
          <span className="text-2xl font-semibold mb-2">Service Provider</span>
          <span className="text-gray-500">Register as a Technician/Service Provider</span>
        </button>
        <button
          className="p-8 rounded-xl shadow-lg bg-white hover:bg-yellow-50 border border-yellow-200 flex flex-col items-center transition"
          onClick={() => handleRegister('moderator')}
        >
          <span className="text-2xl font-semibold mb-2">Moderator</span>
          <span className="text-gray-500">Register as a Store Moderator</span>
        </button>
        <button
          className="p-8 rounded-xl shadow-lg bg-white hover:bg-red-50 border border-red-200 flex flex-col items-center transition"
          onClick={() => handleRegister('admin')}
        >
          <span className="text-2xl font-semibold mb-2">Admin</span>
          <span className="text-gray-500">Register as a System Admin</span>
        </button>
      </div>
      <div className="mt-10 text-gray-700">
        Already have an account?{' '}
        <a href="/auth/signin" className="text-blue-600 underline font-semibold">Sign In</a>
      </div>
    </div>
  );
}