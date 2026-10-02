import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function clearAuthStorage() {
  localStorage.removeItem('civiclink_user');
  localStorage.removeItem('civiclink_token');
  localStorage.removeItem('civiclink_guest');
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem('civiclink_token');
    if (!storedToken) return null;
    if (isTokenExpired(storedToken)) {
      clearAuthStorage();
      return null;
    }
    return storedToken;
  });

  const [user, setUser] = useState(() => {
    const storedToken = localStorage.getItem('civiclink_token');
    if (!storedToken || isTokenExpired(storedToken)) return null;
    try {
      const savedUser = localStorage.getItem('civiclink_user');
      if (savedUser && savedUser !== 'undefined') return JSON.parse(savedUser);
    } catch (error) {
      clearAuthStorage();
    }
    return null;
  });

  const [isGuest, setIsGuest] = useState(() => {
    return localStorage.getItem('civiclink_guest') === 'true';
  });

  const [loading, setLoading] = useState(false);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setIsGuest(false);
    localStorage.setItem('civiclink_user', JSON.stringify(userData));
    localStorage.setItem('civiclink_token', authToken);
    localStorage.removeItem('civiclink_guest');
  };

  const loginAsGuest = () => {
    setIsGuest(true);
    setUser(null);
    setToken(null);
    localStorage.setItem('civiclink_guest', 'true');
    localStorage.removeItem('civiclink_user');
    localStorage.removeItem('civiclink_token');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsGuest(false);
    clearAuthStorage();
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      loginAsGuest,
      logout,
      isAuthenticated: !!user,
      isGuest,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};