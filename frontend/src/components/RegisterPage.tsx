'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import { useToastStore } from '@/store/toastStore';
import { useRouter } from 'next/navigation';

type Step = 'phone' | 'otp' | 'profile';

export function RegisterPage({ onLoginClick }: { onLoginClick: () => void }) {
  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { setToken, setUser } = useAppStore();
  const { addToast } = useToastStore();

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    
    setLoading(true);
    try {
      await api.register(phoneNumber);
      addToast('OTP sent! Use 123456', 'info');
      setStep('otp');
    } catch (err: any) {
      addToast(err.message || 'Failed to send OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    
    setLoading(true);
    try {
      const data = await api.verifyOtp(phoneNumber, otp);
      setToken(data.access_token);
      setUser(data.user);
      addToast('Phone verified successfully', 'success');
      setStep('profile');
    } catch (err: any) {
      addToast(err.message || 'Invalid OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName) return;
    
    const token = useAppStore.getState().token;
    if (!token) return;
    
    setLoading(true);
    try {
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff`;
      const user = await api.updateProfile(displayName, avatarUrl, token);
      setUser(user);
      addToast('Profile setup complete!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-xl">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-gray-100">Create Account</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {step === 'phone' && 'Enter your phone number to get started'}
            {step === 'otp' && 'Verify your phone number'}
            {step === 'profile' && 'Set up your profile'}
          </p>
        </div>

        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
              <input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Continue'}
            </button>
            <div className="text-center text-sm">
              <button type="button" onClick={onLoginClick} className="text-blue-600 hover:text-blue-500">
                Already have an account? Log in
              </button>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Verification Code</label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-gray-100 shadow-sm text-center tracking-widest focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">For this demo, use code: 123456</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        )}

        {step === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
              <input
                id="name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Jane Doe"
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Complete Setup'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
