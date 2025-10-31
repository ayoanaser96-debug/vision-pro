'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect based on role
        switch (user.role) {
          case 'patient':
            router.push('/dashboard/patient');
            break;
          case 'analyst':
            router.push('/dashboard/analyst');
            break;
          case 'doctor':
            router.push('/dashboard/doctor');
            break;
          case 'admin':
            router.push('/dashboard/admin');
            break;
          case 'pharmacy':
            router.push('/dashboard/pharmacy');
            break;
          default:
            router.push('/login');
        }
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  );
}


