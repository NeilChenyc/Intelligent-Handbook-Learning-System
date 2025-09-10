import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Progress } from './ui/Progress';
import { BookOpen, Clock, Award, Target, Shield, FileText, Building } from 'lucide-react';

const ProgressPage = () => {
  // 模拟公司制度学习进度数据
  const progressData = {
    overall: 75,
    handbooks: [
      { id: 1, name: '员工行为准则', progress: 100, totalSections: 8, completedSections: 8, category: 'employee', mandatory: true },
      { id: 2, name: '考勤管理制度', progress: 100, totalSections: 6, completedSections: 6, category: 'employee', mandatory: true },
      { id: 3, name: '薪酬福利制度', progress: 65, totalSections: 10, completedSections: 7, category: 'employee', mandatory: true },
      { id: 4, name: '实验室安全操作规程', progress: 100, totalSections: 12, completedSections: 12, category: 'lab', mandatory: true },
      { id: 5, name: '化学品管理手册', progress: 40, totalSections: 8, completedSections: 3, category: 'lab', mandatory: true },
      { id: 6, name: '设备操作维护手册', progress: 0, totalSections: 15, completedSections: 0, category: 'lab', mandatory: true },
      { id: 7, name: '消防安全管理制度', progress: 100, totalSections: 5, completedSections: 5, category: 'safety', mandatory: true },
      { id: 8, name: 'ISO质量管理体系', progress: 75, totalSections: 20, completedSections: 15, category: 'quality', mandatory: true },
      { id: 9, name: '数据保护与隐私政策', progress: 100, totalSections: 7, completedSections: 7, category: 'compliance', mandatory: true }
    ],
    stats: {
      totalStudyTime: 89,
      completedHandbooks: 4,
      totalHandbooks: 9,
      certifications: 3,
      complianceRate: 78
    }
  };

  // 环形进度组件
  const CircularProgress = ({ percentage, size = 120, strokeWidth = 8 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#3b82f6"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-in-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
        </div>
      </div>
    );
  };

  // 获取分类图标
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'employee': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'lab': return <Building className="w-5 h-5 text-green-500" />;
      case 'safety': return <Shield className="w-5 h-5 text-red-500" />;
      case 'quality': return <Award className="w-5 h-5 text-purple-500" />;
      case 'compliance': return <Shield className="w-5 h-5 text-orange-500" />;
      default: return <BookOpen className="w-5 h-5 text-gray-500" />;
    }
  };

  // 获取分类名称
  const getCategoryName = (category) => {
    switch (category) {
      case 'employee': return '员工手册';
      case 'lab': return '实验室手册';
      case 'safety': return '安全规范';
      case 'quality': return '质量管理';
      case 'compliance': return '合规制度';
      default: return '其他';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">制度学习进度</h2>
        <p className="text-gray-600">跟踪您的公司规章制度学习进展和合规状态</p>
      </div>

      {/* 总体进度卡片 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-500" />
              <span>总体进度</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <CircularProgress percentage={progressData.overall} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>学习统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{progressData.stats.totalStudyTime}h</p>
                  <p className="text-sm text-gray-600">学习时长</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {progressData.stats.completedHandbooks}/{progressData.stats.totalHandbooks}
                  </p>
                  <p className="text-sm text-gray-600">完成制度</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{progressData.stats.certifications}</p>
                  <p className="text-sm text-gray-600">获得认证</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{progressData.stats.complianceRate}%</p>
                  <p className="text-sm text-gray-600">合规率</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 制度手册进度列表 */}
      <Card>
        <CardHeader>
          <CardTitle>制度学习详情</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {progressData.handbooks.map((handbook) => (
              <div key={handbook.id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getCategoryIcon(handbook.category)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{handbook.name}</h3>
                      <p className="text-sm text-gray-600">
                        {handbook.completedSections}/{handbook.totalSections} 章节完成 • {getCategoryName(handbook.category)}
                        {handbook.mandatory && <span className="text-red-600 ml-2">必修</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-blue-600">{handbook.progress}%</span>
                  </div>
                </div>
                
                <Progress value={handbook.progress} className="h-3" />
                
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>已完成 {handbook.completedSections} 章节</span>
                  <span>还需 {handbook.totalSections - handbook.completedSections} 章节</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 学习建议 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>学习建议</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 个性化建议</h4>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• 建议优先完成 "React 基础教程"，您已经完成了 85%</li>
              <li>• "JavaScript 进阶" 课程进度良好，保持学习节奏</li>
              <li>• 可以适当增加每日学习时长，目标是每天 2-3 小时</li>
              <li>• 完成当前课程后，建议参加相关的小测练习巩固知识</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressPage;