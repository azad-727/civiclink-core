import React from 'react';
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
import NotFound from './pages/NotFound';
import About from './pages/About';
// Pages
// import Home from './pages/Home'; // (Placeholder if you haven't built yet)
// import Discover from './pages/Discover'; // (Placeholder if you haven't built yet)
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ReportIssue from './pages/ReportIssue';
import Profile from './pages/Profile'; // <-- Import the Profile
import Home from './pages/Home';
import ExploreMap from './pages/ExploreMap';
import IssueDetail from './pages/IssueDetail';
const Placeholder = ({ title }) => <div className="p-12 text-center text-2xl font-bold">{title}</div>;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}