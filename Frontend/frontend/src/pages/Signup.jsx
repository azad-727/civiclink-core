import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'; // Added CheckCircle
import api from '../apiClient';
import './Auth.css';

export default function SignUp() {
  const [formData, setFormData] = useState({
    fname: '',
    email: '',
    password: '',
    confirm_password: '',
    terms: false
  });
  const [status, setStatus] = useState('idle'); // Can be 'idle', 'loading', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirm_password) {
      setStatus('error');
      setErrorMessage('Passwords do not match.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      await api.post('/auth/register', {
        name: formData.fname,
        email: formData.email,
        password: formData.password
      });
      
      // TRIGGER SUCCESS ANIMATION
      setStatus('success'); 
      
      // Delay the redirect to let the user see the success screen
      setTimeout(() => {
        navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
      }, 2000);

    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message || 'Failed to create account. Please try again.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-slide-up">
        
        <div className="auth-banner">
          <img src="/images/logo_wbg.png" alt="CivicLink Logo" className="auth-logo" />
          <div className="auth-banner-content">
            <h1>Connecting Communities.<br />Building Better Cities.</h1>
          </div>
        </div>

        <div className="auth-form-container">
          {/* Conditional Rendering: Switch between Form and Success Screen */}
          {status === 'success' ? (
            <div className="auth-success-screen animate-pop-in">
              <CheckCircle size={64} className="text-green-500 mb-4 animate-bounce-short" />
              <h2>Welcome Aboard!</h2>
              <p>Your account has been created successfully.</p>
            </div>
          ) : (
            <>
              <h2 className="animate-fade-in-stagger-1">Create Account</h2>

              {status === 'error' && (
                <div className="alert-box alert-error animate-shake">
                  <AlertCircle size={18} /> {errorMessage}
                </div>
              )}

              <form className="auth-form" onSubmit={handleSubmit}>
                <input type="text" name="fname" className="auth-input animate-fade-in-stagger-2" placeholder="Full Name" value={formData.fname} onChange={handleChange} required />
                <input type="email" name="email" className="auth-input animate-fade-in-stagger-3" placeholder="Email Address" value={formData.email} onChange={handleChange} required />
                <input type="password" name="password" className="auth-input animate-fade-in-stagger-4" placeholder="Password" value={formData.password} onChange={handleChange} required />
                <input type="password" name="confirm_password" className="auth-input animate-fade-in-stagger-5" placeholder="Confirm Password" value={formData.confirm_password} onChange={handleChange} required />
                
                <div className="terms-group animate-fade-in-stagger-6">
                  <input type="checkbox" id="terms" name="terms" checked={formData.terms} onChange={handleChange} required />
                  <label htmlFor="terms">I agree to the <Link to="/terms">Terms of Service</Link></label>
                </div>

                <button type="submit" className="btn-submit animate-fade-in-stagger-7" disabled={status === 'loading'}>
                  {status === 'loading' ? <span className="flex-center gap-2"><Loader2 className="spinner animate-spin" size={18} /> Creating...</span> : 'Create Account'}
                </button>
              </form>

              <div className="auth-footer animate-fade-in-stagger-8">
                Already have an account? <Link to="/login">Sign In</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}