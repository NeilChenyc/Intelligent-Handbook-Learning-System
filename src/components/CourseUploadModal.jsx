import React, { useState, useRef } from 'react';
import { Button } from './ui/Button';
import { 
  Upload, 
  X, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';

const CourseUploadModal = ({ isOpen, onClose, onUpload }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  
  // AI Agent 相关状态
  const [enableAI, setEnableAI] = useState(true);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiStatus, setAiStatus] = useState('');
  const [aiTaskId, setAiTaskId] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [agentConfig, setAgentConfig] = useState({
    quizCount: 5,
    questionsPerQuiz: 8,
    difficulty: 'MEDIUM',
    processingMode: 'auto'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      alert('请选择PDF文件');
    }
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert('请选择要上传的PDF文件');
      return;
    }

    if (!formData.title.trim()) {
      alert('请输入课程标题');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // 创建FormData对象
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('teacherId', '1'); // 暂时硬编码教师ID
      formDataToSend.append('handbookFile', file);

      // 调用后端API
      const response = await fetch('http://localhost:8080/courses/upload', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('上传失败');
      }

      const courseData = await response.json();
      setUploadProgress(100);

      // 如果启用了AI功能，触发AI处理
      if (enableAI) {
        await handleAIProcessing(courseData.id);
      } else {
        // 直接完成上传流程
        completeUpload(courseData);
      }

    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败，请重试');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // AI处理函数
  const handleAIProcessing = async (courseId) => {
    try {
      setAiProcessing(true);
      setAiStatus('正在启动AI分析...');
      setAiProgress(10);

      // 构建AI处理请求
      const agentRequest = {
        courseId: courseId,
        processingMode: agentConfig.processingMode,
        quizCount: agentConfig.quizCount,
        questionsPerQuiz: agentConfig.questionsPerQuiz,
        difficulty: agentConfig.difficulty,
        overwriteExisting: true,
        additionalInstructions: '请根据PDF内容生成高质量的测验题目'
      };

      // 调用AI处理API
      const aiResponse = await fetch(`http://localhost:8080/api/agent/process-course/${courseId}/async`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentRequest),
      });

      if (!aiResponse.ok) {
        throw new Error('AI处理启动失败');
      }

      const aiData = await aiResponse.json();
      setAiTaskId(aiData.taskId);
      setAiStatus('AI正在分析PDF内容...');
      setAiProgress(30);

      // 轮询检查AI处理状态
      await pollAIStatus(aiData.taskId, courseId);

    } catch (error) {
      console.error('AI处理失败:', error);
      setAiStatus('AI处理失败，但课程已成功上传');
      setAiProcessing(false);
      
      // 即使AI失败，也要完成基本的上传流程
      setTimeout(() => {
        completeUpload({ id: courseId });
      }, 2000);
    }
  };

  // 轮询AI处理状态
  const pollAIStatus = async (taskId, courseId) => {
    const maxAttempts = 60; // 最多轮询5分钟
    let attempts = 0;

    const poll = async () => {
      try {
        const statusResponse = await fetch(`http://localhost:8080/api/agent/status/${taskId}`);
        if (!statusResponse.ok) {
          throw new Error('获取AI状态失败');
        }

        const statusData = await statusResponse.json();
        setAiStatus(statusData.message || statusData.currentStep || '处理中...');
        setAiProgress(Math.min(30 + statusData.progress * 0.6, 90));

        if (statusData.status === 'COMPLETED') {
          setAiStatus('AI分析完成！已生成测验题目');
          setAiProgress(100);
          setAiResult(statusData);
          setAiProcessing(false);
          
          setTimeout(() => {
            completeUpload({ id: courseId });
          }, 1500);
          return;
        }

        if (statusData.status === 'FAILED') {
          throw new Error(statusData.errorMessage || 'AI处理失败');
        }

        // 继续轮询
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // 每5秒检查一次
        } else {
          throw new Error('AI处理超时');
        }

      } catch (error) {
        console.error('AI状态检查失败:', error);
        setAiStatus('AI处理遇到问题，但课程已成功上传');
        setAiProcessing(false);
        
        setTimeout(() => {
          completeUpload({ id: courseId });
        }, 2000);
      }
    };

    // 开始轮询
    setTimeout(poll, 2000);
  };

  // 完成上传流程
  const completeUpload = (courseData) => {
    // 调用父组件的上传回调
    onUpload(courseData);
    
    // 重置表单
    setFormData({
      title: '',
      description: ''
    });
    setFile(null);
    setUploadProgress(0);
    setAiProcessing(false);
    setAiProgress(0);
    setAiStatus('');
    setAiTaskId(null);
    setAiResult(null);
    
    // 延迟关闭模态框
    setTimeout(() => {
      setUploading(false);
      onClose();
    }, 1000);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">上传新课程</h3>
            <button
              onClick={onClose}
              disabled={uploading || aiProcessing}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 文件上传区域 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                课程手册 (PDF文件)
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : file 
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {file ? (
                  <div className="flex items-center justify-center space-x-3">
                    <FileText className="w-8 h-8 text-green-600" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">拖拽PDF文件到此处，或</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      选择文件
                    </Button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* AI 自动生成设置 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <h4 className="text-sm font-medium text-blue-900">AI 智能生成测验</h4>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableAI}
                    onChange={(e) => setEnableAI(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    enableAI ? 'bg-blue-600' : 'bg-gray-300'
                  }`}>
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      enableAI ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </div>
                </label>
              </div>
              
              {enableAI && (
                <div className="space-y-3">
                  <p className="text-xs text-blue-700">
                    启用后，AI将自动分析PDF内容并生成个性化测验题目
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-blue-800 mb-1">
                        测验数量
                      </label>
                      <select
                        value={agentConfig.quizCount}
                        onChange={(e) => setAgentConfig(prev => ({
                          ...prev,
                          quizCount: parseInt(e.target.value)
                        }))}
                        className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value={3}>3个测验</option>
                        <option value={5}>5个测验</option>
                        <option value={8}>8个测验</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-blue-800 mb-1">
                        每个测验题目数
                      </label>
                      <select
                        value={agentConfig.questionsPerQuiz}
                        onChange={(e) => setAgentConfig(prev => ({
                          ...prev,
                          questionsPerQuiz: parseInt(e.target.value)
                        }))}
                        className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value={5}>5道题</option>
                        <option value={8}>8道题</option>
                        <option value={10}>10道题</option>
                      </select>
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-blue-800 mb-1">
                        难度级别
                      </label>
                      <select
                        value={agentConfig.difficulty}
                        onChange={(e) => setAgentConfig(prev => ({
                          ...prev,
                          difficulty: e.target.value
                        }))}
                        className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="EASY">简单</option>
                        <option value="MEDIUM">中等</option>
                        <option value="HARD">困难</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 课程信息表单 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  课程描述
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="请输入课程描述"
                />
              </div>
            </div>

            {/* 上传进度 */}
            {uploading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-sm font-medium text-blue-900">
                    {uploadProgress < 100 ? '正在上传...' : aiProcessing ? 'AI正在处理...' : '上传完成'}
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  {uploadProgress < 100 
                    ? `${Math.round(uploadProgress)}% - 上传中，请勿关闭页面`
                    : '文件上传成功'
                  }
                </p>
              </div>
            )}

            {/* AI 处理进度 */}
            {aiProcessing && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="relative">
                    <div className="w-5 h-5 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
                  </div>
                  <span className="text-sm font-medium text-purple-900">
                    AI 智能分析中
                  </span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${aiProgress}%` }}
                  />
                </div>
                <p className="text-xs text-purple-700">
                  {aiStatus || '正在分析PDF内容并生成测验题目...'}
                </p>
                {aiResult && (
                  <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs">
                    <p className="text-green-700 font-medium">
                      ✅ 已生成 {aiResult.completedQuizzes || agentConfig.quizCount} 个测验，
                      共 {(aiResult.completedQuizzes || agentConfig.quizCount) * agentConfig.questionsPerQuiz} 道题目
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 提示信息 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">上传说明：</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>仅支持PDF格式的文件</li>
                    <li>文件大小不超过50MB</li>
                    {enableAI ? (
                      <>
                        <li>启用AI后，系统将自动分析PDF内容并生成个性化测验题目</li>
                        <li>AI分析过程可能需要2-5分钟，请耐心等待</li>
                        <li>生成的题目可在课程管理页面中查看和编辑</li>
                      </>
                    ) : (
                      <li>上传后可手动创建测验题目</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* 按钮组 */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={uploading || aiProcessing}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={uploading || !file || aiProcessing}
                className="flex items-center space-x-2"
              >
                {uploading || aiProcessing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>{uploading ? '上传中...' : 'AI处理中...'}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>{enableAI ? '上传并生成测验' : '上传课程'}</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CourseUploadModal;