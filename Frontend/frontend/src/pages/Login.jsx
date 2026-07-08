import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../apiClient';
import './Auth.css';

export default function Login() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Make the API call
      const response = await apiClient.post('/auth/login', credentials);
      
      // 2. Extract the token (this matches your Postman screenshot perfectly)
      const token = response.token; 
      
      // 3. Construct the user object manually from the root JSON properties
      const user = {
        username: response.username,
        email: response.email,
        role: response.role
      };

      // 4. Safety check
      if (!token) {
        alert("Login failed: Backend did not return a token.");
        return;
      }

      // 5. Pass the newly constructed user and token into your context
      login(user, token);
      
      // 6. Redirect
      navigate('/home');
    } catch (error) {
      console.error(error);
      alert('Invalid credentials');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        
        {/* LEFT PANEL: Banner & Branding */}
        <div className="auth-banner">
          <img src="images/logo_wbg.png" alt="CivicLink Logo" className="auth-logo" />
          <div className="auth-banner-content">
            <h1>
              Connecting Communities.<br />
              Building Better Cities.
            </h1>
          </div>
        </div>

        {/* RIGHT PANEL: Form */}
        <div className="auth-form-container">
          <h2>Sign In to Your Account</h2>

          <form className="auth-form" onSubmit={handleSubmit}>
            <input 
              type="email" 
              name="email" 
              className="auth-input"
              placeholder="Email" 
              value={credentials.email} 
              onChange={handleChange} 
              required 
            />
            <input 
              type="password" 
              name="password" 
              className="auth-input"
              placeholder="Password" 
              value={credentials.password} 
              onChange={handleChange} 
              required 
            />
            
            <button type="submit" className="btn-submit">
              Sign In
            </button>
          </form>


          <div className="auth-footer">
            Don't have an account? <Link to="/register">Sign Up</Link>
          </div>
        </div>

      </div>
    </div>
  );
}