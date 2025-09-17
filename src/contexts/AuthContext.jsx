import React, { createContext, useContext, useState, useEffect } from 'react';

// 创建认证上下文
const AuthContext = createContext();

// 自定义Hook用于使用认证上下文
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 认证提供者组件
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 组件挂载时检查本地存储的用户信息
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

  // 登录函数
  const login = (userInfo) => {
    setUser(userInfo);
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
  };

  // 登出函数
  const logout = () => {
    setUser(null);
    localStorage.removeItem('userInfo');
  };

  // 检查用户是否已登录
  const isAuthenticated = () => {
    return user !== null;
  };

  // 检查用户是否为管理员
  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  // 检查用户是否为学员
  const isStudent = () => {
    return user && user.role === 'student';
  };

  // 获取用户权限
  const getUserPermissions = () => {
    if (!user) return [];
    
    const basePermissions = ['dashboard', 'learning', 'progress'];
    
    if (user.role === 'admin') {
      return [...basePermissions, 'compliance', 'user-management', 'system-settings'];
    } else if (user.role === 'student') {
      return basePermissions;
    }
    
    return [];
  };

  // 检查用户是否有特定权限
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