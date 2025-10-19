import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { X, Plus, Trash2 } from 'lucide-react';

const QuestionEditModal = ({ isOpen, onClose, question, quizzes, onSave, isAddMode }) => {
  const [formData, setFormData] = useState({
    questionText: '',
    type: 'SINGLE_CHOICE',
    points: 10,
    orderIndex: 0,
    explanation: '',
    quizId: '',
    options: [
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false }
    ]
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (question && !isAddMode) {
        // 编辑模式：使用现有题目数据
        setFormData({
          questionText: question.text || '',
          type: question.type || 'SINGLE_CHOICE',
          points: question.points || 1,
          orderIndex: question.orderIndex || 0,
          explanation: question.explanation || '',
          quizId: question.quiz?.id || '',
          options: question.options ? question.options.map(opt => ({
            optionText: opt.text || '',
            isCorrect: opt.isCorrect || false
          })) : [
            { optionText: '', isCorrect: false },
            { optionText: '', isCorrect: false }
          ]
        });
      } else {
        // 添加模式：计算下一个排序索引
        const nextOrderIndex = getNextOrderIndex();
        setFormData({
          questionText: '',
          type: 'SINGLE_CHOICE',
          points: 1,
          orderIndex: nextOrderIndex,
          explanation: '',
          quizId: '',
          options: [
            { optionText: '', isCorrect: false },
            { optionText: '', isCorrect: false }
          ]
        });
      }
      setErrors({});
    }
  }, [isOpen, question, isAddMode, quizzes]);

  // 计算下一个排序索引
  const getNextOrderIndex = () => {
    if (!formData.quizId || !quizzes.length) return 1;
    
    // 这里需要从父组件传入当前quiz的题目列表来计算最大排序
    // 暂时返回1，后续需要优化
    return 1;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleOptionChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  const handleCorrectAnswerChange = (index) => {
    if (formData.type === 'SINGLE_CHOICE') {
      // 单选题：只能选择一个正确答案
      setFormData(prev => ({
        ...prev,
        options: prev.options.map((option, i) => ({
          ...option,
          isCorrect: i === index
        }))
      }));
    } else if (formData.type === 'MULTIPLE_CHOICE') {
      // 多选题：可以选择多个正确答案
      setFormData(prev => ({
        ...prev,
        options: prev.options.map((option, i) => 
          i === index ? { ...option, isCorrect: !option.isCorrect } : option
        )
      }));
    }
  };

  const addOption = () => {
    if (formData.options.length < 6) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, { optionText: '', isCorrect: false }]
      }));
    }
  };

  const removeOption = (index) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.questionText.trim()) {
      newErrors.questionText = '题目内容不能为空';
    }

    if (!formData.quizId) {
      newErrors.quizId = '请选择所属小测';
    }

    if (formData.points <= 0) {
      newErrors.points = '分值必须大于0';
    }

    if (formData.type === 'SINGLE_CHOICE' || formData.type === 'MULTIPLE_CHOICE') {
      // 检查选项
      const validOptions = formData.options.filter(opt => opt.optionText.trim());
      if (validOptions.length < 2) {
        newErrors.options = '至少需要2个有效选项';
      }

      // 检查是否有正确答案
      const correctOptions = formData.options.filter(opt => opt.isCorrect);
      if (correctOptions.length === 0) {
        newErrors.correctAnswer = '请选择正确答案';
      }

      if (formData.type === 'SINGLE_CHOICE' && correctOptions.length > 1) {
        newErrors.correctAnswer = '单选题只能有一个正确答案';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // 准备提交数据
    const submitData = {
      questionText: formData.questionText.trim(),
      type: formData.type,
      points: parseInt(formData.points),
      explanation: formData.explanation.trim(),
      quizId: parseInt(formData.quizId)
    };

    // 如果是选择题，添加选项数据
    if (formData.type === 'SINGLE_CHOICE' || formData.type === 'MULTIPLE_CHOICE') {
      submitData.options = formData.options
        .filter(opt => opt.optionText.trim())
        .map(opt => ({
          optionText: opt.optionText.trim(),
          isCorrect: opt.isCorrect
        }));
    }

    onSave(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isAddMode ? '添加题目' : '编辑题目'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                题目内容 *
              </label>
              <textarea
                value={formData.questionText}
                onChange={(e) => handleInputChange('questionText', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.questionText ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={3}
                placeholder="请输入题目内容..."
              />
              {errors.questionText && (
                <p className="mt-1 text-sm text-red-600">{errors.questionText}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                题目类型 *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SINGLE_CHOICE">单选题</option>
                <option value="MULTIPLE_CHOICE">多选题</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                所属小测 *
              </label>
              <select
                value={formData.quizId}
                onChange={(e) => handleInputChange('quizId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.quizId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">请选择小测</option>
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>
                    小测 {num}
                  </option>
                ))}
              </select>
              {errors.quizId && (
                <p className="mt-1 text-sm text-red-600">{errors.quizId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分值 *
              </label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => handleInputChange('points', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.points ? 'border-red-500' : 'border-gray-300'
                }`}
                min="1"
                max="100"
              />
              {errors.points && (
                <p className="mt-1 text-sm text-red-600">{errors.points}</p>
              )}
            </div>
          </div>

          {/* 选项设置 */}
          {(formData.type === 'SINGLE_CHOICE' || formData.type === 'MULTIPLE_CHOICE') && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  选项设置 *
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={formData.options.length >= 6}
                  className="flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>添加选项</span>
                </Button>
              </div>

              <div className="space-y-3">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex items-center">
                      <input
                        type={formData.type === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'}
                        name="correctAnswer"
                        checked={option.isCorrect}
                        onChange={() => handleCorrectAnswerChange(index)}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700 min-w-[20px]">
                        {String.fromCharCode(65 + index)}.
                      </span>
                    </div>
                    <input
                      type="text"
                      value={option.optionText}
                      onChange={(e) => handleOptionChange(index, 'optionText', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`选项 ${String.fromCharCode(65 + index)}`}
                    />
                    {formData.options.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {errors.options && (
                <p className="mt-1 text-sm text-red-600">{errors.options}</p>
              )}
              {errors.correctAnswer && (
                <p className="mt-1 text-sm text-red-600">{errors.correctAnswer}</p>
              )}

              <p className="mt-2 text-sm text-gray-500">
                {formData.type === 'SINGLE_CHOICE' 
                  ? '请选择一个正确答案' 
                  : '可以选择多个正确答案'
                }
              </p>
            </div>
          )}

          {/* 解析 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              题目解析
            </label>
            <textarea
              value={formData.explanation}
              onChange={(e) => handleInputChange('explanation', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="请输入题目解析（可选）..."
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              取消
            </Button>
            <Button type="submit">
              {isAddMode ? '添加题目' : '保存修改'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionEditModal;