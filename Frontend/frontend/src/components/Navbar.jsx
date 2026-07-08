import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Search, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; 
import './Navbar.css';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { isAuthenticated } = useAuth(); 
  const navigate = useNavigate();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // UPDATED: Now built for a form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault(); // Stops the page from refreshing
    
    if (searchQuery.trim() !== '') {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery(''); // Clear the input after searching
      closeMobileMenu();  // Close mobile menu if open
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        
        <div className="nav-left">
          <Link to="/" className="nav-brand" onClick={closeMobileMenu}>
            <img src="images/logo_wbg.png" alt="CivicLink Logo" className="brand-logo" />
            <span className="brand-text">CivicLink</span>
          </Link>

          <ul className="nav-links desktop-only">
            <li><NavLink to="/home" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Home</NavLink></li>
            <li><NavLink to="/explore" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Discover</NavLink></li>
            <li><NavLink to="/report" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Submit Issue</NavLink></li>
            <li><NavLink to="/about" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>About Us</NavLink></li>
          </ul>
        </div>

        <div className="nav-right desktop-only">
          
          {/* FIX: Changed to a <form> tag with onSubmit */}
          <form className="search-wrapper" onSubmit={handleSearchSubmit}>
            {/* Added onClick and pointer cursor to the icon so it acts like a button */}
            <Search 
              size={18} 
              className="search-icon" 
              onClick={handleSearchSubmit} 
              style={{ cursor: 'pointer' }}
            />
            <input 
              type="text" 
              placeholder="Search issues..." 
              className="search-input"
              aria-label="Search issues"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {isAuthenticated ? (
            <Link to="/profile" className="icon-btn profile-filled" aria-label="Profile">
              <User size={20} color="white" strokeWidth={2.5} />
            </Link>
          ) : (
            <Link to="/login" className="icon-btn" aria-label="Sign In">
              <User size={22} />
            </Link>
          )}
        </div>

        <button className="mobile-toggle" onClick={toggleMobileMenu} aria-label="Toggle Menu">
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        
        {/* FIX: Changed to a <form> tag with onSubmit */}
        <form className="mobile-search-container" onSubmit={handleSearchSubmit}>
          <Search 
            size={18} 
            className="mobile-search-icon" 
            onClick={handleSearchSubmit}
          />
          <input 
            type="text" 
            placeholder="Search issues..." 
            className="mobile-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <ul className="mobile-nav-links">
          <li><NavLink to="/home" onClick={closeMobileMenu} className={({ isActive }) => isActive ? "mobile-link active" : "mobile-link"}>Home</NavLink></li>
          <li><NavLink to="/explore" onClick={closeMobileMenu} className={({ isActive }) => isActive ? "mobile-link active" : "mobile-link"}>Discover</NavLink></li>
          <li><NavLink to="/report" onClick={closeMobileMenu} className={({ isActive }) => isActive ? "mobile-link active" : "mobile-link"}>Submit Issue</NavLink></li>
          <li><NavLink to="/about" onClick={closeMobileMenu} className={({ isActive }) => isActive ? "mobile-link active" : "mobile-link"}>About Us</NavLink></li>
        </ul>
        <div className="mobile-actions">
          {isAuthenticated ? (
            <Link to="/profile" className="mobile-action-btn" onClick={closeMobileMenu}><User size={20} /> My Profile</Link>
          ) : (
            <Link to="/login" className="mobile-action-btn" onClick={closeMobileMenu}><User size={20} /> Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
}