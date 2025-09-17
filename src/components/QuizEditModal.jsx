import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { X, Upload, FileText, Plus, Trash2 } from 'lucide-react';

const QuizEditModal = ({ isOpen, onClose, quiz, onSave, isAddMode = false }) => {
  const [formData, setFormData] = useState({
    question: '',
    type: 'multiple-choice',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    points: 10
  });

  const [questionFile, setQuestionFile] = useState(null);
  const [errors, setErrors] = useState({});

  const questionTypes = [
    { value: 'multiple-choice', label: '选择题' },
    { value: 'true-false', label: '判断题' }
  ];

  useEffect(() => {
    if (quiz && !isAddMode) {
      setFormData({
        question: quiz.question || '',
        type: quiz.type || 'multiple-choice',
        options: quiz.options || ['', '', '', ''],
        correctAnswer: quiz.correctAnswer || 0,
        explanation: quiz.explanation || '',
        points: quiz.points || 10
      });
    } else {
      // 重置表单为添加模式
      setFormData({
        question: '',
        type: 'multiple-choice',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        points: 10
      });
    }
    setQuestionFile(null);
    setErrors({});
  }, [quiz, isAddMode, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const addOption = () => {
    if (formData.options.length < 6) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, '']
      }));
    }
  };

  const removeOption = (index) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        options: newOptions,
        correctAnswer: prev.correctAnswer >= index && prev.correctAnswer > 0 
          ? prev.correctAnswer - 1 
          : prev.correctAnswer
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'text/plain' || file.type === 'application/pdf' || file.name.endsWith('.md')) {
        setQuestionFile(file);
        // 如果是文本文件，尝试读取内容
        if (file.type === 'text/plain' || file.name.endsWith('.md')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setFormData(prev => ({
              ...prev,
              question: e.target.result
            }));
          };
          reader.readAsText(file);
        }
      } else {
        alert('请选择文本文件(.txt)、Markdown文件(.md)或PDF文件(.pdf)');
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.question.trim()) {
      newErrors.question = '题目内容不能为空';
    }

    if (formData.type === 'multiple-choice' || formData.type === 'true-false') {
      const validOptions = formData.options.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        newErrors.options = '至少需要2个选项';
      }
      if (formData.correctAnswer >= validOptions.length) {
        newErrors.correctAnswer = '请选择正确答案';
      }
    }

    if (!formData.explanation.trim()) {
      newErrors.explanation = '解析不能为空';
    }

    if (formData.points < 1 || formData.points > 100) {
      newErrors.points = '分值必须在1-100之间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const quizData = {
      ...formData,
      id: isAddMode ? Date.now() : quiz.id,
      options: formData.options.filter(opt => opt.trim()) // 过滤空选项
    };

    onSave(quizData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">
            {isAddMode ? '添加新题目' : '编辑题目'}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 题目类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              题目类型
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {questionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* 题目内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              题目内容
            </label>
            <div className="space-y-3">
              <textarea
                name="question"
                value={formData.question}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-vertical ${
                  errors.question ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="请输入题目内容..."
              />
              {errors.question && (
                <p className="text-red-500 text-sm">{errors.question}</p>
              )}
              
              {/* 文件上传 */}
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">上传题目文件</span>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".txt,.md,.pdf"
                    className="hidden"
                  />
                </label>
                {questionFile && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span>{questionFile.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 选项设置（仅选择题和判断题） */}
          {(formData.type === 'multiple-choice' || formData.type === 'true-false') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选项设置
              </label>
              <div className="space-y-3">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="correctAnswer"
                      value={index}
                      checked={formData.correctAnswer === index}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        correctAnswer: parseInt(e.target.value)
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`选项 ${String.fromCharCode(65 + index)}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    {formData.options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {formData.options.length < 6 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>添加选项</span>
                  </Button>
                )}
                {errors.options && (
                  <p className="text-red-500 text-sm">{errors.options}</p>
                )}
                {errors.correctAnswer && (
                  <p className="text-red-500 text-sm">{errors.correctAnswer}</p>
                )}
              </div>
            </div>
          )}

          {/* 解析 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              答案解析
            </label>
            <textarea
              name="explanation"
              value={formData.explanation}
              onChange={handleInputChange}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-vertical ${
                errors.explanation ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="请输入答案解析..."
            />
            {errors.explanation && (
              <p className="text-red-500 text-sm">{errors.explanation}</p>
            )}
          </div>

          {/* 分值 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分值
            </label>
            <input
              type="number"
              name="points"
              value={formData.points}
              onChange={handleInputChange}
              min="1"
              max="100"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                errors.points ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.points && (
              <p className="text-red-500 text-sm">{errors.points}</p>
            )}
          </div>

          {/* 按钮 */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
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

export default QuizEditModal;