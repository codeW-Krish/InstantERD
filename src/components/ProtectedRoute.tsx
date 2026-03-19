import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '../hooks/useUser';

export function ProtectedRoute() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen bg-blueprint grid-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-t-2 border-emerald-accent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function PublicRoute() {
  const { user, loading } = useUser();
  
  if (loading) return null;
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
