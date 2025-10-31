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

  // Create new upload task
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

  // Update task status
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

  // Delete task
  const removeTask = useCallback((taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  // Get active tasks (tasks in progress)
  const getActiveTasks = useCallback(() => {
    return tasks.filter(task => 
      task.status === 'uploading' || task.status === 'ai_processing'
    );
  }, [tasks]);

  // Get latest task
  const getLatestTask = useCallback(() => {
    if (tasks.length === 0) return null;
    return tasks[tasks.length - 1];
  }, [tasks]);

  // Clean completed tasks (optional, for periodic cleanup)
  const cleanupCompletedTasks = useCallback(() => {
    const now = new Date();
    setTasks(prev => prev.filter(task => {
      if (task.status === 'completed' || task.status === 'failed') {
        const timeDiff = now - new Date(task.createdAt);
        return timeDiff < 5 * 60 * 1000; // Keep for 5 minutes
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