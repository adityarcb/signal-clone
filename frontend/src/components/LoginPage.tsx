'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { api } from '@/lib/api';

export function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('+1555000001');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { setUser, setToken } = useAppStore();
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await api.login(phoneNumber);
      setUser(response.user);
      setToken(response.access_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Signal Clone</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your phone number to sign in
          </p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1555000001"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-6 border-t border-gray-200 pt-6">
          <p className="text-xs text-gray-500">
            Demo phone numbers (seeded users):
          </p>
          <ul className="mt-2 space-y-1 text-xs text-gray-600">
            <li>+1555000001 - Alice Johnson</li>
            <li>+1555000002 - Bob Smith</li>
            <li>+1555000003 - Charlie Davis</li>
            <li>+1555000004 - Diana Evans</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
