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
  const [loading, setLoading] = useState(false); // 添加loading状态

  // 添加clearError函数
  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (question && !isAddMode) {
        // 编辑模式：使用现有题目数据
        setFormData({
          questionText: question.questionText || '',
          type: question.type || 'SINGLE_CHOICE',
          points: question.points || 1,
          orderIndex: question.orderIndex || 0,
          explanation: question.explanation || '',
          quizId: question.quiz?.id || '',
          options: question.options ? question.options.map(opt => ({
            optionText: opt.optionText || '',
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
    clearError(field);
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
      newErrors.questionText = 'Question content cannot be empty';
    }

    if (!formData.quizId) {
      newErrors.quizId = 'Please select a quiz';
    }

    if (!formData.points || formData.points <= 0) {
      newErrors.points = 'Points must be greater than 0';
    }

    // Check options for choice questions
    if (formData.type === 'SINGLE_CHOICE' || formData.type === 'MULTIPLE_CHOICE') {
      const validOptions = formData.options.filter(opt => opt.optionText && opt.optionText.trim());
      if (validOptions.length < 2) {
        newErrors.options = 'At least 2 valid options are required';
      }
      
      // Check if there is a correct answer
      const correctAnswers = formData.options.filter(opt => opt.isCorrect);
      if (correctAnswers.length === 0) {
        newErrors.correctAnswer = 'Please select the correct answer';
      }
      
      // Single choice: only one correct answer
      if (formData.type === 'SINGLE_CHOICE' && correctAnswers.length > 1) {
        newErrors.correctAnswer = 'Single choice questions can only have one correct answer';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true); // 开始提交时设置loading为true

    try {
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

      await onSave(submitData);
    } catch (error) {
      console.error('Error saving question:', error);
    } finally {
      setLoading(false); // 无论成功还是失败都要重置loading状态
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isAddMode ? 'Add Question' : 'Edit Question'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Content *
              </label>
              <textarea
                value={formData.questionText}
                onChange={(e) => {
                  setFormData({...formData, questionText: e.target.value});
                  clearError('questionText');
                }}
                placeholder="Please enter question content..."
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.questionText ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={3}
              />
              {errors.questionText && <p className="text-red-500 text-sm mt-1">{errors.questionText}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SINGLE_CHOICE">Single Choice</option>
                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz *
              </label>
              <select
                value={formData.quizId}
                onChange={(e) => {
                  setFormData({...formData, quizId: e.target.value});
                  clearError('quizId');
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.quizId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Please select a quiz</option>
                {quizzes && quizzes.length > 0 
                  ? quizzes.map((quiz, idx) => (
                      <option key={quiz.id} value={quiz.id}>
                        {quiz.title ? `Quiz ${idx + 1}: ${quiz.title}` : `Quiz ${quiz.id}`}
                      </option>
                    ))
                  : <option value="" disabled>No quizzes available for this course</option>}
              </select>
              {errors.quizId && <p className="text-red-500 text-sm mt-1">{errors.quizId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Points *
              </label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => {
                  setFormData({...formData, points: parseInt(e.target.value) || 0});
                  clearError('points');
                }}
                min="1"
                max="100"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.points ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.points && <p className="text-red-500 text-sm mt-1">{errors.points}</p>}
            </div>
          </div>

          {/* Option Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Option Settings *</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add Option</span>
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
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
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
                ? 'Please select one correct answer'
                : 'You can select multiple correct answers'
            }
            </p>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Explanation
            </label>
            <textarea
              value={formData.explanation}
              onChange={(e) => setFormData({...formData, explanation: e.target.value})}
              placeholder="Please enter question explanation (optional)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {isAddMode ? 'Add Question' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionEditModal;