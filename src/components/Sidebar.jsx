import React from 'react';
import { cn } from '../lib/utils';
import { 
  Home, 
  CheckSquare, 
  FileText, 
  RotateCcw, 
  TrendingUp, 
  FileCheck, 
  Award,
  LogOut,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ activeMenu, onMenuChange }) => {
  const { user, isAdmin, logout } = useAuth();

  // 基础菜单项
  const baseMenuItems = [
    { id: 'home', label: '学习首页', icon: Home },
    { id: 'tasks', label: '我的课程', icon: CheckSquare },
    { id: 'retry', label: '错题重做', icon: RotateCcw },
    { id: 'progress', label: '学习进度', icon: TrendingUp },
    { id: 'certificate', label: '证书中心', icon: Award },
  ];

  // 管理员专用菜单项
  const adminMenuItems = [
    { id: 'course-management', label: '课程管理', icon: BookOpen },
    { id: 'report', label: '合规报告', icon: FileCheck },
  ];

  // 根据用户身份动态生成菜单项
  const menuItems = isAdmin() 
    ? [...baseMenuItems.slice(0, 4), ...adminMenuItems, baseMenuItems[4]] // 在证书中心前插入管理员菜单项
    : baseMenuItems;

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 h-full flex flex-col">
      <nav className="p-4 flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onMenuChange(item.id)}
                  className={cn(
                    'w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors',
                    activeMenu === item.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* 用户信息和登出按钮 */}
      <div className="p-4 border-t border-gray-200">
        <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || '用户'}
              </p>
              <p className="text-xs text-gray-500">
                {user?.role === 'admin' ? '管理员' : '学员'}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-2 text-left rounded-lg transition-colors text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium">退出登录</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;