import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import HomePage from './components/HomePage';
import TaskPage from './components/TaskPage';
import QuizPage from './components/QuizPage';
import ProgressPage from './components/ProgressPage';
import HandbookPage from './components/HandbookPage';
import PlaceholderPage from './components/PlaceholderPage';
import ReportPage from './components/ReportPage';
import CertificatePage from './components/CertificatePage';
import CourseManagementPage from './components/CourseManagementPage';
import QuizManagementPage from './components/QuizManagementPage';

// 主应用内容组件
const AppContent = () => {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [activeMenu, setActiveMenu] = useState('home');

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

  // 如果未登录，显示登录页面
  if (!isAuthenticated()) {
    return <LoginPage onLogin={login} />;
  }

  const renderContent = () => {
    switch (activeMenu) {
      case 'home':
        return <HandbookPage />;
      case 'tasks':
        return <TaskPage />;
      case 'quiz':
        return <QuizPage />;
      case 'retry':
        return (
          <PlaceholderPage 
            title="错题重做" 
            description="重新练习之前做错的题目" 
          />
        );
      case 'progress':
        return <ProgressPage />;
      case 'course-management':
        return <CourseManagementPage />;
      case 'report':
        return <ReportPage />;
      case 'certificate':
        return <CertificatePage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航栏 */}
      <Header />
      
      <div className="flex h-[calc(100vh-80px)]">
        {/* 左侧侧边栏 */}
        <Sidebar activeMenu={activeMenu} onMenuChange={setActiveMenu} />
        
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