import React from 'react';
import { Link } from 'react-router-dom';
// We only import Mail and MapPin, as Lucide removed brand icons
import { Mail, MapPin } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        
        {/* Brand & About Section */}
        <div className="footer-brand-section">
          <Link to="/home" className="footer-logo">
            <img src="images/logo_wbg.png" alt="CivicLink Logo" className="footer-brand-img" />
            <span>CivicLink</span>
          </Link>
          <p className="footer-description">
            Empowering citizens to report, track, and resolve local infrastructure issues. Together, we build better cities.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-links-section">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/home">Home</Link></li>
            <li><Link to="/explore">Discover Issues</Link></li>
            <li><Link to="/report">Report an Issue</Link></li>
            <li><Link to="/about">About Us</Link></li>
          </ul>
        </div>

        {/* Legal & Support */}
        <div className="footer-links-section">
          <h3>Support</h3>
          <ul>
            <li><Link to="/faq">Help & FAQ</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/guidelines">Community Guidelines</Link></li>
          </ul>
        </div>

        {/* Contact & Socials */}
        <div className="footer-contact-section">
          <h3>Connect With Us</h3>
          <p className="contact-item">
            <Mail size={16} /> support@civiclink.com
          </p>
          <p className="contact-item">
            <MapPin size={16} /> At Every Citizen Hearts.
          </p>
          
          <div className="social-icons">
            {/* Custom SVG for Facebook */}
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>
            
            {/* Custom SVG for Twitter */}
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
              </svg>
            </a>
            
            {/* Custom SVG for Instagram */}
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
          </div>
        </div>

      </div>
      
      {/* Copyright Bar */}
      <div className="footer-bottom">
        <p>&copy; {currentYear} CivicLink. All rights reserved.</p>
      </div>
    </footer>
  );
}