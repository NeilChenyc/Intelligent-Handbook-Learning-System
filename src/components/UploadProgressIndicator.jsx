import React, { useState, useEffect } from 'react';
import { useUploadProgress } from '../contexts/UploadProgressContext';
import { 
  Loader, 
  CheckCircle, 
  AlertCircle, 
  X, 
  ChevronDown, 
  ChevronUp,
  Upload,
  Brain
} from 'lucide-react';

const UploadProgressIndicator = () => {
  const { tasks, getActiveTasks, removeTask } = useUploadProgress();
  const [isExpanded, setIsExpanded] = useState(false);
  const activeTasks = getActiveTasks();

  // 自动展开当有活跃任务时
  useEffect(() => {
    if (activeTasks.length > 0) {
      setIsExpanded(true);
    }
  }, [activeTasks.length]);

  // 如果没有任务，不显示指示器
  if (tasks.length === 0) {
    return null;
  }

  const getStatusIcon = (task) => {
    switch (task.status) {
      case 'uploading':
        return <Loader className="w-4 h-4 animate-spin text-blue-600" />;
      case 'ai_processing':
        return <Brain className="w-4 h-4 animate-pulse text-purple-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Upload className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusText = (task) => {
    switch (task.status) {
      case 'uploading':
        return `Uploading ${Math.round(task.uploadProgress || 0)}%`;
      case 'ai_processing':
        return task.aiStatus || `AI Processing ${Math.round(task.aiProgress || 0)}%`;
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown Status';
    }
  };

  const getProgressPercentage = (task) => {
    let progress = 0;
    if (task.status === 'uploading') {
      progress = task.uploadProgress || 0;
    } else if (task.status === 'ai_processing') {
      progress = task.aiProgress || 0;
    } else if (task.status === 'completed') {
      progress = 100;
    }
    
    // Debug log
    console.log('Task progress:', task.title, task.status, 'uploadProgress:', task.uploadProgress, 'aiProgress:', task.aiProgress, 'calculated:', progress);
    
    return Math.max(0, Math.min(100, progress));
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* 主指示器 */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* 头部 - 总览 */}
        <div 
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            {activeTasks.length > 0 ? (
              <Loader className="w-5 h-5 animate-spin text-blue-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
            <span className="text-sm font-medium text-gray-900">
              {activeTasks.length > 0 
                ? `${activeTasks.length} task${activeTasks.length > 1 ? 's' : ''} in progress` 
                : 'All tasks completed'
              }
            </span>
          </div>
          <div className="flex items-center space-x-1">
            {tasks.length > 1 && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {tasks.length}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>

        {/* 展开的任务列表 */}
        {isExpanded && (
          <div className="border-t border-gray-200 max-h-80 overflow-y-auto">
            {tasks.slice(-5).reverse().map((task) => (
              <div key={task.id} className="p-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {getStatusIcon(task)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getStatusText(task)}
                      </p>
                    </div>
                  </div>
                  {(task.status === 'completed' || task.status === 'failed') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTask(task.id);
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* 进度条 */}
                {(task.status === 'uploading' || task.status === 'ai_processing') && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        task.status === 'uploading' 
                          ? 'bg-blue-600' 
                          : 'bg-gradient-to-r from-purple-500 to-pink-500'
                      }`}
                      style={{ width: `${getProgressPercentage(task)}%` }}
                    />
                  </div>
                )}

                {/* AI Processing Details */}
                {task.status === 'ai_processing' && task.aiStatus && (
                  <div className="mt-2 p-2 bg-purple-50 rounded text-xs">
                    <div className="flex items-center space-x-1">
                      <Brain className="w-3 h-3 text-purple-600" />
                      <span className="text-purple-600 font-medium">AI Analysis</span>
                    </div>
                  </div>
                )}

                {/* Completion Status Details */}
                {task.status === 'completed' && (
                  <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                    <p className="text-green-700">
                      ✅ Course uploaded successfully, AI quiz questions generated
                    </p>
                  </div>
                )}

                {/* Failure Status Details */}
                {task.status === 'failed' && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-xs">
                    <p className="text-red-700">
                      ❌ Upload failed, please retry
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 简化指示器（当收起时显示最新任务） */}
      {!isExpanded && activeTasks.length > 0 && (
        <div className="mt-2">
          {activeTasks.slice(-1).map((task) => (
            <div key={task.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-2">
              <div className="flex items-center space-x-2">
                {getStatusIcon(task)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {task.title}
                  </p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                <div 
                  className={`h-1 rounded-full transition-all duration-300 ${
                    task.status === 'uploading' 
                      ? 'bg-blue-600' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-500'
                  }`}
                  style={{ width: `${getProgressPercentage(task)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadProgressIndicator;