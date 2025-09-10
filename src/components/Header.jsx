import React from 'react';
import { Button } from './ui/Button';
import { LogOut, User } from 'lucide-react';

const Header = () => {
  const handleLogout = () => {
    // 这里可以添加退出登录的逻辑
    console.log('用户退出登录');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold text-gray-900">智能Handbook学习系统</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* 用户头像 */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm text-gray-700">用户名</span>
        </div>
        
        {/* 退出按钮 */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLogout}
          className="flex items-center space-x-1"
        >
          <LogOut className="w-4 h-4" />
          <span>退出</span>
        </Button>
      </div>
    </header>
  );
};

export default Header;