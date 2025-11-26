import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UploadProgressProvider } from './contexts/UploadProgressContext';
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
import ChatbotPage from './components/ChatbotPage';
import UploadProgressIndicator from './components/UploadProgressIndicator';
import FocusTimer from './components/FocusTimer';

// Main app content component
const AppContent = () => {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [activeMenu, setActiveMenu] = useState('tasks');
  const [navigationHistory, setNavigationHistory] = useState(['tasks']);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const [showRegister, setShowRegister] = useState(false);

  // Handle menu changes and update history
  const handleMenuChange = (newMenu) => {
    if (newMenu !== activeMenu) {
      // If current is not at end of history, delete following records
      const newHistory = navigationHistory.slice(0, currentHistoryIndex + 1);
      newHistory.push(newMenu);
      
      setNavigationHistory(newHistory);
      setCurrentHistoryIndex(newHistory.length - 1);
      setActiveMenu(newMenu);
      
      // Update browser history
      window.history.pushState({ menu: newMenu, index: newHistory.length - 1 }, '', `#${newMenu}`);
    }
  };

  // Handle browser forward/back events
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.menu) {
        const { menu, index } = event.state;
        setActiveMenu(menu);
        setCurrentHistoryIndex(index);
      }
    };

    // Listen to browser forward/back events
    window.addEventListener('popstate', handlePopState);
    
    // Initialize browser history
    window.history.replaceState({ menu: activeMenu, index: 0 }, '', `#${activeMenu}`);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Handle keyboard shortcuts and gestures
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Support Cmd+Left/Right (Mac) and Alt+Left/Right (Windows/Linux)
      if ((event.metaKey || event.altKey) && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        event.preventDefault();
        
        if (event.key === 'ArrowLeft' && currentHistoryIndex > 0) {
          // Back - only use browser native operation, popstate event will handle state update
          window.history.back();
        } else if (event.key === 'ArrowRight' && currentHistoryIndex < navigationHistory.length - 1) {
          // Forward - only use browser native operation, popstate event will handle state update
          window.history.forward();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentHistoryIndex, navigationHistory]);

  // Handle touch gestures (support trackpad and touchscreen)
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let isTouching = false;
    let hasTriggered = false; // Prevent duplicate triggers

    const handleTouchStart = (event) => {
      if (event.touches.length === 1) {
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
        isTouching = true;
        hasTriggered = false; // Reset trigger flag
      }
    };

    const handleTouchEnd = (event) => {
      if (isTouching && event.changedTouches.length === 1 && !hasTriggered) {
        const endX = event.changedTouches[0].clientX;
        const endY = event.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const threshold = 100;

        // Ensure horizontal swipe not vertical swipe
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
          hasTriggered = true; // Mark as triggered to prevent duplicates
          
          if (deltaX > 0 && currentHistoryIndex > 0) {
            // Right swipe, back - only use browser native operation, popstate event will handle state update
            window.history.back();
          } else if (deltaX < 0 && currentHistoryIndex < navigationHistory.length - 1) {
            // Left swipe, forward - only use browser native operation, popstate event will handle state update
            window.history.forward();
          }
        }
        
        isTouching = false;
      }
    };

    // Add touchmove event to handle logic during swipe
    const handleTouchMove = (event) => {
      if (isTouching && !hasTriggered) {
        const currentX = event.touches[0].clientX;
        const currentY = event.touches[0].clientY;
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        const threshold = 100;

        // If swipe distance is enough and is horizontal swipe, trigger immediately and mark
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
          hasTriggered = true;
          
          if (deltaX > 0 && currentHistoryIndex > 0) {
            // Right swipe, back
            window.history.back();
          } else if (deltaX < 0 && currentHistoryIndex < navigationHistory.length - 1) {
            // Left swipe, forward
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

  // Handle mouse gestures (Chrome Mac left/right swipe)
  useEffect(() => {
    let startX = 0;
    let isGesturing = false;

    const handleMouseDown = (event) => {
      // Detect if gesture starts at edge
      if (event.clientX < 50 || event.clientX > window.innerWidth - 50) {
        startX = event.clientX;
        isGesturing = true;
      }
    };

    const handleMouseUp = (event) => {
      if (isGesturing) {
        const deltaX = event.clientX - startX;
        const threshold = 100; // Gesture threshold

        if (Math.abs(deltaX) > threshold) {
          if (deltaX > 0 && currentHistoryIndex > 0) {
            // Right swipe, back
            const newIndex = currentHistoryIndex - 1;
            const newMenu = navigationHistory[newIndex];
            setActiveMenu(newMenu);
            setCurrentHistoryIndex(newIndex);
            window.history.back();
          } else if (deltaX < 0 && currentHistoryIndex < navigationHistory.length - 1) {
            // Left swipe, forward
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

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show login or register page
  if (!isAuthenticated()) {
    if (showRegister) {
      return (
        <RegisterPage 
          onRegister={(userInfo) => {
            // After successful registration, can choose auto login or redirect to login page
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
      case 'chatbot':
        return <ChatbotPage />;
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

        {/* 主体ContentArea */}
        <main className="flex-1 overflow-y-auto bg-white">
          {renderContent()}
        </main>
      </div>

      {/* 上传进度指示器 */}
      <UploadProgressIndicator />

      {/* 学习专注模式 */}
      {isAuthenticated() && <FocusTimer />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <UploadProgressProvider>
        <AppContent />
      </UploadProgressProvider>
    </AuthProvider>
  );
}

export default App;