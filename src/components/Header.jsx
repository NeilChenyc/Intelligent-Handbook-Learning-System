import React from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { user } = useAuth();

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
          <span className="text-sm text-gray-700">{user?.name || '用户'}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;