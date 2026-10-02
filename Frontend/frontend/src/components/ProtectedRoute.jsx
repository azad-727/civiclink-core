import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated, isGuest, loading } = useAuth();

  if (loading) return null;

  // Guests and unauthenticated users both get redirected to login
  if (!isAuthenticated || isGuest) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}