'use client';

import { useAppStore } from '@/store/appStore';
import { LoginPage } from '@/components/LoginPage';
import { MainLayout } from '@/components/MainLayout';

export default function Home() {
  const { currentUser, token } = useAppStore();
  
  if (!currentUser || !token) {
    return <LoginPage />;
  }
  
  return <MainLayout />;
}
