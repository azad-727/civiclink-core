import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css'; // Import the new CSS

export default function NotFound() {
  return (
    <div className="not-found-page">
      <img 
        src="/images/404-illustration.gif" 
        alt="Page not found" 
        className="not-found-image" 
      />
      
      <h1 className="not-found-title">
        Whoops! There's nothing to be found here. Sorry!
      </h1>
      
      <p className="not-found-text">
        The page you are looking for does not exist.
      </p>
      
      <Link to="/" className="not-found-link">
        ← Back to CivicLink
      </Link>
    </div>
  );
}