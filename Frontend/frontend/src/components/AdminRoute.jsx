import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Roles allowed past this gate. Pass a custom list via `allowedRoles` if a
// route should be even more restrictive (e.g. Tech Admin panel: ADMIN only).
const DEFAULT_ALLOWED_ROLES = ['ADMIN', 'AMC_OFFICER'];

export default function AdminRoute({ allowedRoles = DEFAULT_ALLOWED_ROLES }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user?.role?.toUpperCase();
  const hasAccess = userRole && allowedRoles.includes(userRole);

  if (!hasAccess) {
    // Logged in, but not an AMC officer/admin — send them back home rather
    // than to /login (they don't need to re-authenticate, just don't belong here).
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}