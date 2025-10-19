import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { X, Save } from 'lucide-react';

const CourseEditModal = ({ isOpen, onClose, course, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  const categories = [
    { value: 'programming', label: '编程开发' },
    { value: 'design', label: '设计创意' },
    { value: 'business', label: '商业管理' },
    { value: 'marketing', label: '市场营销' },
    { value: 'data', label: '数据分析' },
    { value: 'other', label: '其他' }
  ];

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        description: course.description || ''
      });
    }
  }, [course]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('请输入课程标题');
      return;
    }

    const updatedCourse = {
      ...course,
      ...formData
    };

    onSave(updatedCourse);
    onClose();
  };

  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">编辑课程信息</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 课程信息表单 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  课程标题 *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="请输入课程标题"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  课程描述
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="请输入课程描述"
                />
              </div>
            </div>

            {/* 按钮组 */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                取消
              </Button>
              <Button
                type="submit"
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>保存修改</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CourseEditModal;