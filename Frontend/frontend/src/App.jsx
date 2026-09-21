import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Smart root redirect: sends logged-in users to /home, guests to /login
function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/home' : '/login'} replace />;
}
import { AuthProvider } from './context/AuthContext'; 

import AppLayout from './layouts/AppLayout'; 
import ProtectedRoute from './components/ProtectedRoute'; // <-- Import the Bouncer
import AdminRoute from './components/AdminRoute'; // <-- Role-gated bouncer (AMC_OFFICER / ADMIN)
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import SignUp from './pages/SignUp';

const About = React.lazy(() => import('./pages/About'));
const AmcDashboard = React.lazy(() => import('./pages/AmcDashboard'));
const ReportIssue = React.lazy(() => import('./pages/ReportIssue'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Home = React.lazy(() => import('./pages/Home'));
const ExploreMap = React.lazy(() => import('./pages/ExploreMap'));
const IssueDetail = React.lazy(() => import('./pages/IssueDetail'));

const Placeholder = ({ title }) => <div className="p-12 text-center text-2xl font-bold">{title}</div>;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'80vh'}}>Loading...</div>}>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              
              {/* ROOT: Smart redirect based on auth state */}
              <Route index element={<RootRedirect />} />

              {/* PUBLIC ROUTES: Anyone can access these */}
              <Route path="home" element={<Home />} />
              <Route path="explore" element={<ExploreMap />} />
              <Route path="issue/:id" element={<IssueDetail />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<SignUp />} />
              <Route path="about" element={<About />} />
              
              {/* SECURE ROUTES: Requires Authentication */}
              <Route element={<ProtectedRoute />}>
                <Route path="report" element={<ReportIssue />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* ADMIN ROUTES: Requires AMC_OFFICER or ADMIN role */}
              <Route element={<AdminRoute />}>
                <Route path="admin/issues" element={<AmcDashboard />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}