'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import AdminDashboard from '@/components/AdminDashboard';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

function AdminContent() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation Header */}
        <Navigation currentPage="admin" />

        {/* Admin Dashboard Content */}
        <AdminDashboard />
      </div>
      <Footer />
    </main>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminContent />
    </ProtectedRoute>
  );
}