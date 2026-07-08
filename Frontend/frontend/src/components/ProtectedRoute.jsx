import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  // Show a blank screen or spinner while checking local storage on first load
  if (loading) {
    return null; 
  }

  // If authenticated, render the child component (<Outlet />). 
  // If not, redirect to the login page immediately.
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}