'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) return;
    
    // Add a small delay to ensure auth state is properly initialized
    const timeout = setTimeout(() => {
      if (!isLoading) {
        hasRedirected.current = true;
        if (!isAuthenticated) {
          window.location.href = '/login';
        } else if (user?.role === 'admin') {
          window.location.href = '/admin';
        } else if (user?.role === 'kiosk') {
          window.location.href = '/kiosk';
        } else {
          window.location.href = '/login';
        }
      }
    }, 100);
    
    return () => clearTimeout(timeout);
  }, [user, isAuthenticated, isLoading]);

  // If still loading after 2 seconds, redirect to login anyway
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        window.location.href = '/login';
      }
    }, 2000);
    
    return () => clearTimeout(fallbackTimeout);
  }, []);

  // Show loading while determining redirect
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}