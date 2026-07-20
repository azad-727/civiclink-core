import React, { createContext, useState, useContext } from 'react';

// 1. Create the Context
const AuthContext = createContext(null);

// ─── Helper: decode JWT payload without a library ──────────────────────────
function isTokenExpired(token) {
  try {
    // JWT is three Base64 parts separated by dots. The middle part is the payload.
    const payload = JSON.parse(atob(token.split('.')[1]));
    // `exp` is in seconds; Date.now() is in ms
    return payload.exp * 1000 < Date.now();
  } catch {
    // If decoding fails for any reason, treat it as expired to be safe
    return true;
  }
}

// ─── Helper: clear all auth data from storage ──────────────────────────────
function clearAuthStorage() {
  localStorage.removeItem('civiclink_user');
  localStorage.removeItem('civiclink_token');
}

// 2. Create the Provider Component
export const AuthProvider = ({ children }) => {

  // Initialize token first — we need it to validate before setting user
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem('civiclink_token');
    if (!storedToken) return null;

    // ✅ Key fix: if token is already expired on page load, wipe storage immediately
    if (isTokenExpired(storedToken)) {
      console.warn('Stored JWT is expired. Auto-logging out.');
      clearAuthStorage();
      return null;
    }
    return storedToken;
  });

  // Initialize user — only restore if the token above was valid
  const [user, setUser] = useState(() => {
    // If no valid token was found above, don't restore user either
    const storedToken = localStorage.getItem('civiclink_token');
    if (!storedToken || isTokenExpired(storedToken)) return null;

    try {
      const savedUser = localStorage.getItem('civiclink_user');
      if (savedUser && savedUser !== 'undefined') {
        return JSON.parse(savedUser);
      }
    } catch (error) {
      console.error('Failed to parse stored user, clearing storage:', error);
      clearAuthStorage();
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  // Call this when the user successfully logs in via the Java API
  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('civiclink_user', JSON.stringify(userData));
    localStorage.setItem('civiclink_token', authToken);
  };

  // Call this when the user clicks Logout OR when a 401 is received
  const logout = () => {
    setUser(null);
    setToken(null);
    clearAuthStorage();
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAuthenticated: !!user,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Custom hook for easy access
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};