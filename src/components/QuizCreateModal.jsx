import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { X } from 'lucide-react';

const QuizCreateModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    passingScore: 60,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData({ title: '', description: '', passingScore: 60 });
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = '标题不能为空';
    }
    if (!formData.description.trim()) {
      newErrors.description = '描述不能为空';
    }
    const score = parseInt(formData.passingScore, 10);
    if (Number.isNaN(score)) {
      newErrors.passingScore = '通过分数必须是数字';
    } else if (score < 0 || score > 100) {
      newErrors.passingScore = '通过分数需在 0-100 之间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSave({
      title: formData.title.trim(),
      description: formData.description.trim(),
      passingScore: parseInt(formData.passingScore, 10),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">添加小测</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">标题 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="请输入小测标题"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">描述 *</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="请输入小测描述"
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">通过分数 (0-100) *</label>
            <input
              type="number"
              min={0}
              max={100}
              value={formData.passingScore}
              onChange={(e) => handleInputChange('passingScore', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.passingScore ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="请输入通过分数"
            />
            {errors.passingScore && <p className="mt-1 text-sm text-red-600">{errors.passingScore}</p>}
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
            <Button type="submit">添加小测</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuizCreateModal;