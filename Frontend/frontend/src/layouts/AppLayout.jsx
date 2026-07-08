import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ChatWidget from '../components/ChatWidget';
import Footer from '../components/Footer'; 

export default function AppLayout() {
  const location = useLocation();

  // Define which paths should NOT have a footer
  const hideFooter = location.pathname === '/explore';

  return (
    <div className="min-h-screen flex flex-col w-full bg-[#EBEBEB]"> 
      <Navbar />
      
      <main className="flex-grow w-full">
        <Outlet />
      </main>
      
      {/* Conditionally render the footer */}
      {!hideFooter && <Footer />}

      <ChatWidget />
    </div>
  );
}