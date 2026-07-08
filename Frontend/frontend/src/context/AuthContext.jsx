import React, { createContext, useState, useContext } from 'react';

// 1. Create the Context
const AuthContext = createContext(null);

// 2. Create the Provider Component
export const AuthProvider = ({ children }) => {
  
  // Safely initialize user, ignoring corrupted 'undefined' strings
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('civiclink_user');
      if (savedUser && savedUser !== 'undefined') {
        return JSON.parse(savedUser);
      }
    } catch (error) {
      console.error("Failed to parse stored user, clearing storage:", error);
      localStorage.removeItem('civiclink_user');
    }
    return null;
  });

  // Declare token at the TOP LEVEL, not inside a useEffect
  const [token, setToken] = useState(() => {
    return localStorage.getItem('civiclink_token') || null;
  });

  const [loading, setLoading] = useState(false);

  // Call this when the user successfully logs in via your Java API
  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    
    localStorage.setItem('civiclink_user', JSON.stringify(userData));
    localStorage.setItem('civiclink_token', authToken);
  };

  // Call this when the user clicks Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    
    localStorage.removeItem('civiclink_user');
    localStorage.removeItem('civiclink_token');
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

// 3. Create a custom hook so components can easily grab auth data
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};