import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import './Auth.css';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setStep(2);
    } catch (err) {
      setError(err?.message || 'No account found with this email. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', { email, otp, newPassword });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err?.message || 'Invalid or expired OTP. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-card animate-slide-up" style={{ maxWidth: '480px', textAlign: 'center', padding: '60px 40px' }}>
          <div className="animate-pop-in" style={{ fontSize: '4rem', marginBottom: '16px' }}>✅</div>
          <h2 style={{ fontSize: '1.6rem', color: '#1F2937', marginBottom: '12px' }}>Password Reset!</h2>
          <p style={{ color: '#6B7280', marginBottom: '24px', lineHeight: '1.6' }}>
            Your password has been updated successfully.<br />Redirecting you to Sign In...
          </p>
          <div className="animate-spin" style={{ width: '24px', height: '24px', border: '3px solid #E5E7EB', borderTopColor: '#4A72B2', borderRadius: '50%', margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-slide-up">

        {/* LEFT BANNER */}
        <div className="auth-banner">
          <img src="/images/logo_wbg.png" alt="CivicLink Logo" className="auth-logo" />
          <div className="auth-banner-content">
            <h1>
              {step === 1 ? <>Forgot your<br />password?</> : <>Check your<br />inbox.</>}
            </h1>
            <p style={{ marginTop: '12px', opacity: 0.9, fontSize: '1rem', lineHeight: '1.5' }}>
              {step === 1
                ? "No worries! We'll send a one-time code to your email."
                : `We sent a 6-digit OTP to ${email}. It expires in 15 minutes.`}
            </p>
          </div>
        </div>

        {/* RIGHT FORM */}
        <div className="auth-form-container">

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
            {[1, 2].map(s => (
              <div key={s} style={{
                height: '4px', flex: 1, borderRadius: '2px',
                background: s <= step ? '#4A72B2' : '#E5E7EB',
                transition: 'background 0.3s ease'
              }} />
            ))}
          </div>

          <h2 style={{ marginBottom: '6px' }}>
            {step === 1 ? 'Reset Password' : 'Enter OTP & New Password'}
          </h2>
          <p className="auth-subtitle" style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '24px', textAlign: 'center' }}>
            {step === 1
              ? 'Enter the email address linked to your account.'
              : 'Enter the 6-digit code from your email, then set a new password.'}
          </p>

          {/* Error alert */}
          {error && (
            <div className="alert-box alert-error animate-fade-in-stagger-1" style={{ width: '100%', maxWidth: '340px' }}>
              ⚠️ {error}
            </div>
          )}

          {/* STEP 1 — Email */}
          {step === 1 && (
            <form className="auth-form" onSubmit={handleSendOtp}>
              <input
                className="auth-input animate-fade-in-stagger-2"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
              <button className="btn-submit animate-fade-in-stagger-3" type="submit" disabled={loading}>
                {loading
                  ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />
                      Sending OTP...
                    </span>
                  : '📧 Send OTP'}
              </button>
            </form>
          )}

          {/* STEP 2 — OTP + New Password */}
          {step === 2 && (
            <form className="auth-form" onSubmit={handleResetPassword}>
              {/* Big centered OTP input */}
              <input
                className="auth-input animate-fade-in-stagger-1"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
                style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.4rem', fontWeight: '700', color: '#1F2937' }}
              />
              <input
                className="auth-input animate-fade-in-stagger-2"
                type="password"
                placeholder="New password (min. 6 chars)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <input
                className="auth-input animate-fade-in-stagger-3"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
              <button className="btn-submit animate-fade-in-stagger-4" type="submit" disabled={loading}>
                {loading
                  ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />
                      Resetting...
                    </span>
                  : '🔒 Reset Password'}
              </button>
              <button
                type="button"
                onClick={() => { setStep(1); setOtp(''); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '0.875rem', marginTop: '4px', textDecoration: 'underline' }}
              >
                ← Resend OTP to different email
              </button>
            </form>
          )}

          <p className="auth-footer" style={{ marginTop: '28px' }}>
            Remember your password? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
