import React, { createContext, useContext, useState, useCallback } from 'react';

const UploadProgressContext = createContext();

export const useUploadProgress = () => {
  const context = useContext(UploadProgressContext);
  if (!context) {
    throw new Error('useUploadProgress must be used within an UploadProgressProvider');
  }
  return context;
};

export const UploadProgressProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);

  // 创建新的上传任务
  const createTask = useCallback((taskData) => {
    const taskId = Date.now().toString();
    const newTask = {
      id: taskId,
      title: taskData.title,
      status: 'uploading', // uploading, ai_processing, completed, failed
      uploadProgress: 0,
      aiProgress: 0,
      aiStatus: '',
      aiTaskId: null,
      courseId: null,
      createdAt: new Date(),
      ...taskData
    };
    
    setTasks(prev => [...prev, newTask]);
    return taskId;
  }, []);

  // 更新任务状态
  const updateTask = useCallback((taskId, updates) => {
    console.log('Updating task:', taskId, 'with updates:', updates); // Debug log
    setTasks(prev => {
      const updatedTasks = prev.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      );
      console.log('Updated tasks:', updatedTasks); // Debug log
      return updatedTasks;
    });
  }, []);

  // 删除任务
  const removeTask = useCallback((taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  // 获取活跃任务（正在进行中的任务）
  const getActiveTasks = useCallback(() => {
    return tasks.filter(task => 
      task.status === 'uploading' || task.status === 'ai_processing'
    );
  }, [tasks]);

  // 获取最新任务
  const getLatestTask = useCallback(() => {
    if (tasks.length === 0) return null;
    return tasks[tasks.length - 1];
  }, [tasks]);

  // 清理完成的任务（可选，用于定期清理）
  const cleanupCompletedTasks = useCallback(() => {
    const now = new Date();
    setTasks(prev => prev.filter(task => {
      if (task.status === 'completed' || task.status === 'failed') {
        const timeDiff = now - new Date(task.createdAt);
        return timeDiff < 5 * 60 * 1000; // 保留5分钟
      }
      return true;
    }));
  }, []);

  const value = {
    tasks,
    createTask,
    updateTask,
    removeTask,
    getActiveTasks,
    getLatestTask,
    cleanupCompletedTasks
  };

  return (
    <UploadProgressContext.Provider value={value}>
      {children}
    </UploadProgressContext.Provider>
  );
};

export default UploadProgressContext;