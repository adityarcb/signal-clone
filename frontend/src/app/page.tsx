'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { LoginPage } from '@/components/LoginPage';
import { RegisterPage } from '@/components/RegisterPage';
import { MainLayout } from '@/components/MainLayout';

export default function Home() {
  const { currentUser, token } = useAppStore();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  
  if (!currentUser || !token) {
    if (authView === 'login') {
      return <LoginPage onRegisterClick={() => setAuthView('register')} />;
    } else {
      return <RegisterPage onLoginClick={() => setAuthView('login')} />;
    }
  }
  
  return <MainLayout />;
}
