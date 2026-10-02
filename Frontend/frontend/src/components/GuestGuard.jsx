import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GuestGuard({ children, action }) {
  const { isGuest } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  if (!isGuest) return children;

  return (
    <>
      <div onClick={(e) => { e.stopPropagation(); setShowModal(true); }} style={{ display: 'contents', cursor: 'pointer' }}>
        {children}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '32px',
            maxWidth: '400px', width: '90%', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔒</div>
            <h2 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '1.4rem' }}>Account Required</h2>
            <p style={{ color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
              {action || 'This feature'} requires a CivicLink account. Join thousands of citizens making a difference!
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  padding: '10px 24px', background: '#4f46e5', color: '#fff',
                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                  fontWeight: '600', fontSize: '0.95rem'
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                style={{
                  padding: '10px 24px', background: '#f1f5f9', color: '#1e293b',
                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                  fontWeight: '600', fontSize: '0.95rem'
                }}
              >
                Register
              </button>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 16px', background: 'transparent', color: '#94a3b8',
                  border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
