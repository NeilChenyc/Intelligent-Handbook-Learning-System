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
    description: '',
    department: 'Everyone'
  });

  // Department options
  const departments = [
    { value: 'Everyone', label: 'Everyone' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Human Resources', label: 'Human Resources' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Operations', label: 'Operations' }
  ];
  
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  
  // AI Agent related states
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
      alert('Please select a PDF file');
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
      alert('Please select a PDF file to upload');
      return;
    }

    if (!formData.title.trim()) {
      alert('Please enter course title');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create FormData object
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('department', formData.department || 'Everyone');
      formDataToSend.append('teacherId', '1'); // Temporarily hardcode teacher ID
      formDataToSend.append('handbookFile', file);

      // Call backend API
      const response = await fetch('http://localhost:8080/courses/upload', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const courseData = await response.json();
      setUploadProgress(100);

      // If AI is enabled, trigger AI processing
      if (enableAI) {
        await handleAIProcessing(courseData.id);
      } else {
        // Complete upload process directly
        completeUpload(courseData);
      }

    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed, please try again');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // AI processing function
  const handleAIProcessing = async (courseId) => {
    try {
      setAiProcessing(true);
      setAiStatus('Starting AI analysis...');
      setAiProgress(10);

      // Build AI processing request
      const agentRequest = {
        courseId: courseId,
        processingMode: agentConfig.processingMode,
        quizCount: agentConfig.quizCount,
        questionsPerQuiz: agentConfig.questionsPerQuiz,
        difficulty: agentConfig.difficulty,
        overwriteExisting: true,
        additionalInstructions: 'Please generate high-quality quiz questions based on PDF content'
      };

      // Call AI processing API
      const aiResponse = await fetch(`http://localhost:8080/api/agent/process-course/${courseId}/async`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentRequest),
      });

      if (!aiResponse.ok) {
        throw new Error('Failed to start AI processing');
      }

      const aiData = await aiResponse.json();
      setAiTaskId(aiData.taskId);
      setAiStatus('AI is analyzing PDF content...');
      setAiProgress(30);

      // Poll AI processing status
      await pollAIStatus(aiData.taskId, courseId);

    } catch (error) {
      console.error('AI processing failed:', error);
      setAiStatus('AI processing failed, but course uploaded successfully');
      setAiProcessing(false);
      
      // Complete basic upload process even if AI fails
      setTimeout(() => {
        completeUpload({ id: courseId });
      }, 2000);
    }
  };

  // Poll AI processing status
  const pollAIStatus = async (taskId, courseId) => {
    const maxAttempts = 60; // Poll for maximum 5 minutes
    let attempts = 0;

    const poll = async () => {
      try {
        const statusResponse = await fetch(`http://localhost:8080/api/agent/status/${taskId}`);
        if (!statusResponse.ok) {
          throw new Error('Failed to get AI status');
        }

        const statusData = await statusResponse.json();
        setAiStatus(statusData.message || statusData.currentStep || 'Processing...');
        setAiProgress(Math.min(30 + statusData.progress * 0.6, 90));

        if (statusData.status === 'COMPLETED') {
          setAiStatus('AI analysis completed! Quiz questions generated');
          setAiProgress(100);
          setAiResult(statusData);
          setAiProcessing(false);
          
          setTimeout(() => {
            completeUpload({ id: courseId });
          }, 1500);
          return;
        }

        if (statusData.status === 'FAILED') {
          throw new Error(statusData.errorMessage || 'AI processing failed');
        }

        // Continue polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Check every 5 seconds
        } else {
          throw new Error('AI processing timeout');
        }

      } catch (error) {
        console.error('AI status check failed:', error);
        setAiStatus('AI processing encountered issues, but course uploaded successfully');
        setAiProcessing(false);
        
        setTimeout(() => {
          completeUpload({ id: courseId });
        }, 2000);
      }
    };

    // Start polling
    setTimeout(poll, 2000);
  };

  // Complete upload process
  const completeUpload = (courseData) => {
    // Call parent component's upload callback
    onUpload(courseData);
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      department: 'Everyone'
    });
    setFile(null);
    setUploadProgress(0);
    setAiProcessing(false);
    setAiProgress(0);
    setAiStatus('');
    setAiTaskId(null);
    setAiResult(null);
    
    // Delay closing modal
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
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Upload New Course</h3>
            <button
              onClick={onClose}
              disabled={uploading || aiProcessing}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File upload area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Handbook (PDF file)
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
                    <p className="text-gray-600 mb-2">Drag PDF file here, or</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Select File
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

            {/* AI Auto-generation Settings */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <h4 className="text-sm font-medium text-blue-900">AI Smart Quiz Generation</h4>
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
                    When enabled, AI will automatically analyze PDF content and generate personalized quiz questions
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-blue-800 mb-1">
                        Number of Quizzes
                      </label>
                      <select
                        value={agentConfig.quizCount}
                        onChange={(e) => setAgentConfig(prev => ({
                          ...prev,
                          quizCount: parseInt(e.target.value)
                        }))}
                        className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value={3}>3 Quizzes</option>
                        <option value={5}>5 Quizzes</option>
                        <option value={8}>8 Quizzes</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-blue-800 mb-1">
                        Questions per Quiz
                      </label>
                      <select
                        value={agentConfig.questionsPerQuiz}
                        onChange={(e) => setAgentConfig(prev => ({
                          ...prev,
                          questionsPerQuiz: parseInt(e.target.value)
                        }))}
                        className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value={5}>5 Questions</option>
                        <option value={8}>8 Questions</option>
                        <option value={10}>10 Questions</option>
                      </select>
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-blue-800 mb-1">
                        Difficulty Level
                      </label>
                      <select
                        value={agentConfig.difficulty}
                        onChange={(e) => setAgentConfig(prev => ({
                          ...prev,
                          difficulty: e.target.value
                        }))}
                        className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Course Information Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Please enter course title"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="Please enter course description"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Department *
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                >
                  {departments.map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-sm font-medium text-blue-900">
                    {uploadProgress < 100 ? 'Uploading...' : aiProcessing ? 'AI Processing...' : 'Upload Complete'}
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
                    ? `${Math.round(uploadProgress)}% - Uploading, please do not close the page`
                    : 'File uploaded successfully'
                  }
                </p>
              </div>
            )}

            {/* AI Processing Progress */}
            {aiProcessing && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="relative">
                    <div className="w-5 h-5 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
                  </div>
                  <span className="text-sm font-medium text-purple-900">
                    AI Smart Analysis in Progress
                  </span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${aiProgress}%` }}
                  />
                </div>
                <p className="text-xs text-purple-700">
                  {aiStatus || 'Analyzing PDF content and generating quiz questions...'}
                </p>
                {aiResult && (
                  <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs">
                    <p className="text-green-700 font-medium">
                      ✅ Generated {aiResult.completedQuizzes || agentConfig.quizCount} quizzes,
                      totaling {(aiResult.completedQuizzes || agentConfig.quizCount) * agentConfig.questionsPerQuiz} questions
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Upload Instructions:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Only PDF format files are supported</li>
                    <li>File size should not exceed 50MB</li>
                    {enableAI ? (
                      <>
                        <li>With AI enabled, the system will automatically analyze PDF content and generate personalized quiz questions</li>
                        <li>AI analysis may take 2-5 minutes, please be patient</li>
                        <li>Generated questions can be viewed and edited in the course management page</li>
                      </>
                    ) : (
                      <li>After upload, you can manually create quiz questions</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Button Group */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={uploading || aiProcessing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploading || !file || aiProcessing}
                className="flex items-center space-x-2"
              >
                {uploading || aiProcessing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>{uploading ? 'Uploading...' : 'AI Processing...'}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>{enableAI ? 'Upload and Generate Quiz' : 'Upload Course'}</span>
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