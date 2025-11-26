import React, { createContext, useContext, useState, useEffect, useReducer } from 'react';
import { clearChatSession } from '../api/chatbotApi';

// Create authentication context
const AuthContext = createContext();

// 专注历史数据结构
// {
//   userId: string,
//   duration: number,  // 分钟
//   timestamp: string, // ISO格式时间戳
//   completed: boolean // 是否完成
// }

// Auth状态reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload };
    case 'LOGOUT':
      return { ...state, user: null, focusHistory: [] };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_FOCUS_HISTORY':
      // 保存到localStorage
      if (state.user) {
        localStorage.setItem(`focusHistory_${state.user.id}`, JSON.stringify(action.payload));
      }
      return { ...state, focusHistory: action.payload };
    case 'ADD_FOCUS_SESSION':
      const newHistory = [...state.focusHistory, action.payload];
      if (state.user) {
        localStorage.setItem(`focusHistory_${state.user.id}`, JSON.stringify(newHistory));
      }
      return { ...state, focusHistory: newHistory };
    case 'INITIALIZE_FOCUS_HISTORY':
      return { ...state, focusHistory: action.payload || [] };
    default:
      return state;
  }
};

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
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    focusHistory: [],
    isLoading: true
  });

  // 从localStorage加载专注历史
  const loadFocusHistory = (userId) => {
    try {
      const storedHistory = localStorage.getItem(`focusHistory_${userId}`);
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        // 验证数据格式
        if (Array.isArray(parsedHistory)) {
          dispatch({ type: 'INITIALIZE_FOCUS_HISTORY', payload: parsedHistory });
        }
      }
    } catch (error) {
      console.error('Error loading focus history:', error);
      localStorage.removeItem(`focusHistory_${userId}`);
    }
  };

  // Check local stored user info when component mounts
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
          const userInfo = JSON.parse(storedUser);
          dispatch({ type: 'LOGIN', payload: userInfo });
          loadFocusHistory(userInfo.id);
        }
      } catch (error) {
        console.error('Error parsing stored user info:', error);
        localStorage.removeItem('userInfo');
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = (userInfo) => {
    dispatch({ type: 'LOGIN', payload: userInfo });
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    loadFocusHistory(userInfo.id);
  };

  // Logout function
  const logout = () => {
    dispatch({ type: 'LOGOUT' });
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
    return state.user !== null;
  };

  // Check if user is admin
  const isAdmin = () => {
    return state.user && (state.user.role === 'admin' || state.user.role === 'ADMIN');
  };

  // Check if user is student
  const isStudent = () => {
    return state.user && (state.user.role === 'student' || state.user.role === 'STUDENT');
  };

  // Get user permissions
  const getUserPermissions = () => {
    if (!state.user) return [];

    const basePermissions = ['dashboard', 'learning', 'progress'];

    if (state.user.role === 'admin' || state.user.role === 'ADMIN') {
      return [...basePermissions, 'compliance', 'user-management', 'system-settings'];
    } else if (state.user.role === 'student' || state.user.role === 'STUDENT') {
      return basePermissions;
    }

    return [];
  };

  // Check if user has specific permission
  const hasPermission = (permission) => {
    const permissions = getUserPermissions();
    return permissions.includes(permission);
  };

  // 专注模式相关方法
  const addFocusSession = (sessionData) => {
    if (!state.user) return;

    const session = {
      userId: state.user.id,
      timestamp: new Date().toISOString(),
      completed: true,
      ...sessionData
    };

    dispatch({ type: 'ADD_FOCUS_SESSION', payload: session });
    return session;
  };

  const getFocusHistory = (filter = {}) => {
    let filtered = [...state.focusHistory];

    if (filter.startDate) {
      filtered = filtered.filter(session =>
        new Date(session.timestamp) >= filter.startDate
      );
    }

    if (filter.endDate) {
      filtered = filtered.filter(session =>
        new Date(session.timestamp) <= filter.endDate
      );
    }

    if (filter.completed !== undefined) {
      filtered = filtered.filter(session =>
        session.completed === filter.completed
      );
    }

    return filtered;
  };

  const getFocusStats = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    let todayTotal = 0;
    let weekTotal = 0;
    let monthTotal = 0;
    let streak = 0;
    const completedDates = new Set();

    state.focusHistory.forEach(session => {
      const sessionDate = new Date(session.timestamp);

      if (sessionDate >= today) {
        todayTotal += session.duration;
      }
      if (sessionDate >= weekAgo) {
        weekTotal += session.duration;
      }
      if (sessionDate >= monthAgo) {
        monthTotal += session.duration;
      }

      if (session.completed) {
        const dateStr = sessionDate.toISOString().split('T')[0];
        completedDates.add(dateStr);
      }
    });

    // 计算连续专注天数
    const currentDate = new Date(today);
    while (completedDates.has(currentDate.toISOString().split('T')[0])) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    const totalSessions = state.focusHistory.length;
    const average = totalSessions > 0 ? Math.round(weekTotal / Math.min(7, totalSessions)) : 0;

    return {
      today: todayTotal,
      week: weekTotal,
      month: monthTotal,
      streak,
      average,
      totalSessions,
      totalMinutes: state.focusHistory.reduce((sum, session) => sum + session.duration, 0)
    };
  };

  const value = {
    state,
    dispatch,
    user: state.user,
    focusHistory: state.focusHistory,
    isLoading: state.isLoading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isStudent,
    getUserPermissions,
    hasPermission,
    addFocusSession,
    getFocusHistory,
    getFocusStats
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};