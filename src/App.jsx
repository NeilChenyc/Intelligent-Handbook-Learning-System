import React, { useState } from 'react';
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

function App() {
  const [activeMenu, setActiveMenu] = useState('home');

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
}

export default App;