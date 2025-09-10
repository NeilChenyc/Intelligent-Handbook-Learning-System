import React from 'react';
import { cn } from '../lib/utils';
import { 
  Home, 
  CheckSquare, 
  FileText, 
  RotateCcw, 
  TrendingUp, 
  FileCheck, 
  Award 
} from 'lucide-react';

const Sidebar = ({ activeMenu, onMenuChange }) => {
  const menuItems = [
    { id: 'home', label: '学习首页', icon: Home },
    { id: 'tasks', label: '我的任务', icon: CheckSquare },
    { id: 'quiz', label: '小测练习', icon: FileText },
    { id: 'retry', label: '错题重做', icon: RotateCcw },
    { id: 'progress', label: '学习进度', icon: TrendingUp },
    { id: 'report', label: '合规报告', icon: FileCheck },
    { id: 'certificate', label: '证书中心', icon: Award },
  ];

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 h-full">
      <nav className="p-4">
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
    </aside>
  );
};

export default Sidebar;