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
  BookOpen,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ activeMenu, onMenuChange }) => {
  const { user, isAdmin, logout } = useAuth();

  // Base menu items
  const baseMenuItems = [
    { id: 'tasks', label: 'My Courses', icon: CheckSquare },
    { id: 'retry', label: 'Wrong Questions', icon: RotateCcw },
    { id: 'progress', label: 'Learning Progress', icon: TrendingUp },
    { id: 'chatbot', label: 'AI Assistant', icon: MessageCircle },
    { id: 'certificate', label: 'Certificate Center', icon: Award },
  ];

  // Admin-only menu items
  const adminMenuItems = [
    { id: 'course-management', label: 'Course Management', icon: BookOpen },
    { id: 'report', label: 'Compliance Report', icon: FileCheck },
  ];

  // Dynamically generate menu items based on user identity
  const menuItems = isAdmin() 
    ? [...baseMenuItems.slice(0, 4), ...adminMenuItems, baseMenuItems[4]] // Insert admin menu items before certificate center
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
      
      {/* User info and logout button */}
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
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500">
                {user?.role === 'admin' ? 'Administrator' : 'Student'}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-2 text-left rounded-lg transition-colors text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;