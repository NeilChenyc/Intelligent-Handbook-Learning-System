import React, { createContext, useContext, useState, useEffect } from 'react';
import { clearChatSession } from '../api/chatbotApi';

// Create authentication context
const AuthContext = createContext();

// Custom Hook for using authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Authentication provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check local stored user info when component mounts
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
          const userInfo = JSON.parse(storedUser);
          setUser(userInfo);
        }
      } catch (error) {
        console.error('Error parsing stored user info:', error);
        localStorage.removeItem('userInfo');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = (userInfo) => {
    setUser(userInfo);
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('userInfo');
    // Clear chatbot session when user logs out to prevent memory sharing
    try {
      clearChatSession();
    } catch (error) {
      console.error('Error clearing chat session on logout:', error);
    }
  };

  // Check if user is logged in
  const isAuthenticated = () => {
    return user !== null;
  };

  // Check if user is admin
  const isAdmin = () => {
    return user && (user.role === 'admin' || user.role === 'ADMIN');
  };

  // Check if user is student
  const isStudent = () => {
    return user && (user.role === 'student' || user.role === 'STUDENT');
  };

  // Get user permissions
  const getUserPermissions = () => {
    if (!user) return [];
    
    const basePermissions = ['dashboard', 'learning', 'progress'];
    
    if (user.role === 'admin' || user.role === 'ADMIN') {
      return [...basePermissions, 'compliance', 'user-management', 'system-settings'];
    } else if (user.role === 'student' || user.role === 'STUDENT') {
      return basePermissions;
    }
    
    return [];
  };

  // Check if user has specific permission
  const hasPermission = (permission) => {
    const permissions = getUserPermissions();
    return permissions.includes(permission);
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isStudent,
    getUserPermissions,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;