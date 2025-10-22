import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import HomePage from './components/HomePage';
import CoursePage from './components/CoursePage';
import QuizPage from './components/QuizPage';
import ProgressPage from './components/ProgressPage';
import HandbookPage from './components/HandbookPage';
import PlaceholderPage from './components/PlaceholderPage';
import WrongQuestionsPage from './components/WrongQuestionsPage';
import ReportPage from './components/ReportPage';
import CertificatePage from './components/CertificatePage';
import CourseManagementPage from './components/CourseManagementPage';
import QuizManagementPage from './components/QuizManagementPage';
import TestQuizPage from './components/TestQuizPage';

// 主应用内容组件
const AppContent = () => {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [activeMenu, setActiveMenu] = useState('tasks');
  const [navigationHistory, setNavigationHistory] = useState(['tasks']);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const [showRegister, setShowRegister] = useState(false);

  // 处理菜单变化并更新历史记录
  const handleMenuChange = (newMenu) => {
    if (newMenu !== activeMenu) {
      // 如果当前不在历史记录的末尾，删除后面的记录
      const newHistory = navigationHistory.slice(0, currentHistoryIndex + 1);
      newHistory.push(newMenu);
      
      setNavigationHistory(newHistory);
      setCurrentHistoryIndex(newHistory.length - 1);
      setActiveMenu(newMenu);
      
      // 更新浏览器历史记录
      window.history.pushState({ menu: newMenu, index: newHistory.length - 1 }, '', `#${newMenu}`);
    }
  };

  // 处理浏览器前进后退事件
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.menu) {
        const { menu, index } = event.state;
        setActiveMenu(menu);
        setCurrentHistoryIndex(index);
      }
    };

    // 监听浏览器前进后退事件
    window.addEventListener('popstate', handlePopState);
    
    // 初始化浏览器历史记录
    window.history.replaceState({ menu: activeMenu, index: 0 }, '', `#${activeMenu}`);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // 处理键盘快捷键和手势
  useEffect(() => {
    const handleKeyDown = (event) => {
      // 支持 Cmd+Left/Right (Mac) 和 Alt+Left/Right (Windows/Linux)
      if ((event.metaKey || event.altKey) && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        event.preventDefault();
        
        if (event.key === 'ArrowLeft' && currentHistoryIndex > 0) {
          // 后退 - 只使用浏览器原生操作，popstate事件会处理状态更新
          window.history.back();
        } else if (event.key === 'ArrowRight' && currentHistoryIndex < navigationHistory.length - 1) {
          // 前进 - 只使用浏览器原生操作，popstate事件会处理状态更新
          window.history.forward();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentHistoryIndex, navigationHistory]);

  // 处理触摸手势（支持触控板和触摸屏）
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let isTouching = false;
    let hasTriggered = false; // 防止重复触发

    const handleTouchStart = (event) => {
      if (event.touches.length === 1) {
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
        isTouching = true;
        hasTriggered = false; // 重置触发标志
      }
    };

    const handleTouchEnd = (event) => {
      if (isTouching && event.changedTouches.length === 1 && !hasTriggered) {
        const endX = event.changedTouches[0].clientX;
        const endY = event.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const threshold = 100;

        // 确保是水平滑动而不是垂直滑动
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
          hasTriggered = true; // 标记已触发，防止重复
          
          if (deltaX > 0 && currentHistoryIndex > 0) {
            // 右滑，后退 - 只使用浏览器原生操作，popstate事件会处理状态更新
            window.history.back();
          } else if (deltaX < 0 && currentHistoryIndex < navigationHistory.length - 1) {
            // 左滑，前进 - 只使用浏览器原生操作，popstate事件会处理状态更新
            window.history.forward();
          }
        }
        
        isTouching = false;
      }
    };

    // 添加 touchmove 事件来处理滑动过程中的逻辑
    const handleTouchMove = (event) => {
      if (isTouching && !hasTriggered) {
        const currentX = event.touches[0].clientX;
        const currentY = event.touches[0].clientY;
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        const threshold = 100;

        // 如果滑动距离足够且是水平滑动，立即触发并标记
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
          hasTriggered = true;
          
          if (deltaX > 0 && currentHistoryIndex > 0) {
            // 右滑，后退
            window.history.back();
          } else if (deltaX < 0 && currentHistoryIndex < navigationHistory.length - 1) {
            // 左滑，前进
            window.history.forward();
          }
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentHistoryIndex, navigationHistory]);

  // 处理鼠标手势（Chrome Mac 左右滑动）
  useEffect(() => {
    let startX = 0;
    let isGesturing = false;

    const handleMouseDown = (event) => {
      // 检测是否是在边缘开始的手势
      if (event.clientX < 50 || event.clientX > window.innerWidth - 50) {
        startX = event.clientX;
        isGesturing = true;
      }
    };

    const handleMouseUp = (event) => {
      if (isGesturing) {
        const deltaX = event.clientX - startX;
        const threshold = 100; // 手势阈值

        if (Math.abs(deltaX) > threshold) {
          if (deltaX > 0 && currentHistoryIndex > 0) {
            // 右滑，后退
            const newIndex = currentHistoryIndex - 1;
            const newMenu = navigationHistory[newIndex];
            setActiveMenu(newMenu);
            setCurrentHistoryIndex(newIndex);
            window.history.back();
          } else if (deltaX < 0 && currentHistoryIndex < navigationHistory.length - 1) {
            // 左滑，前进
            const newIndex = currentHistoryIndex + 1;
            const newMenu = navigationHistory[newIndex];
            setActiveMenu(newMenu);
            setCurrentHistoryIndex(newIndex);
            window.history.forward();
          }
        }
        
        isGesturing = false;
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [currentHistoryIndex, navigationHistory]);

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载...</p>
        </div>
      </div>
    );
  }

  // 如果未登录，显示登录或注册页面
  if (!isAuthenticated()) {
    if (showRegister) {
      return (
        <RegisterPage 
          onRegister={(userInfo) => {
            // 注册成功后可以选择自动登录或跳转到登录页面
            setShowRegister(false);
          }}
          onBackToLogin={() => setShowRegister(false)}
        />
      );
    }
    return (
      <LoginPage 
        onLogin={login} 
        onShowRegister={() => setShowRegister(true)}
      />
    );
  }

  const renderContent = () => {
    switch (activeMenu) {
      case 'tasks':
        return <CoursePage />;
      case 'quiz':
        return <QuizPage />;
      case 'retry':
        return <WrongQuestionsPage />;
      case 'progress':
        return <ProgressPage />;
      case 'course-management':
        return <CourseManagementPage />;
      case 'report':
        return <ReportPage />;
      case 'certificate':
        return <CertificatePage />;
      case 'test':
        return <TestQuizPage />;
      default:
        return <CoursePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航栏 */}
      <Header />
      
      <div className="flex h-[calc(100vh-80px)]">
        {/* 左侧侧边栏 */}
        <Sidebar activeMenu={activeMenu} onMenuChange={handleMenuChange} />
        
        {/* 主体内容区域 */}
        <main className="flex-1 overflow-y-auto bg-white">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;