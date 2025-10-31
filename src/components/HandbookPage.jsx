import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { BookOpen, Clock, Award, TrendingUp, FileText, Shield, Users, Building, Download, Eye, CheckCircle } from 'lucide-react';

const HandbookPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  // TODO: Translate - Mock company policy learning data
  const handbookData = {
    stats: {
      totalDocuments: 12,
      completedDocuments: 8,
      studyHours: 45,
      complianceRate: 92
    },
    categories: [
      { id: 'all', name: '全部', count: 12 },
      { id: 'employee', name: '员工手册', count: 4 },
      { id: 'lab', name: '实验室手册', count: 3 },
      { id: 'safety', name: '安全规范', count: 2 },
      { id: 'quality', name: '质量管理', count: 2 },
      { id: 'compliance', name: '合规制度', count: 1 }
    ],
    documents: [
      {
        id: 1,
        title: '员工行为准则',
        category: 'employee',
        description: '公司员工基本行为规范和职业道德要求',
        status: 'completed',
        progress: 100,
        lastStudied: '2024-01-10',
        estimatedTime: '2小时',
        mandatory: true,
        version: 'v2.1',
        effectiveDate: '2024-01-01'
      },
      {
        id: 2,
        title: '考勤管理制度',
        category: 'employee',
        description: '员工考勤、请假、加班等相关管理规定',
        status: 'completed',
        progress: 100,
        lastStudied: '2024-01-08',
        estimatedTime: '1.5小时',
        mandatory: true,
        version: 'v1.3',
        effectiveDate: '2023-12-01'
      },
      {
        id: 3,
        title: '薪酬福利制度',
        category: 'employee',
        description: '员工薪酬结构、福利待遇和绩效考核制度',
        status: 'in_progress',
        progress: 65,
        lastStudied: '2024-01-12',
        estimatedTime: '3小时',
        mandatory: true,
        version: 'v2.0',
        effectiveDate: '2024-01-01'
      },
      {
        id: 4,
        title: '培训发展制度',
        category: 'employee',
        description: '员工培训计划、职业发展路径和学习资源',
        status: 'not_started',
        progress: 0,
        lastStudied: null,
        estimatedTime: '2.5小时',
        mandatory: false,
        version: 'v1.2',
        effectiveDate: '2023-11-01'
      },
      {
        id: 5,
        title: '实验室安全操作规程',
        category: 'lab',
        description: '实验室基本安全规范和应急处理程序',
        status: 'completed',
        progress: 100,
        lastStudied: '2024-01-05',
        estimatedTime: '4小时',
        mandatory: true,
        version: 'v3.1',
        effectiveDate: '2024-01-01'
      },
      {
        id: 6,
        title: '化学品管理手册',
        category: 'lab',
        description: '化学试剂采购、存储、使用和废料处理规范',
        status: 'in_progress',
        progress: 40,
        lastStudied: '2024-01-11',
        estimatedTime: '3.5小时',
        mandatory: true,
        version: 'v2.2',
        effectiveDate: '2023-12-15'
      },
      {
        id: 7,
        title: '设备操作维护手册',
        category: 'lab',
        description: '实验设备的标准操作程序和维护保养要求',
        status: 'not_started',
        progress: 0,
        lastStudied: null,
        estimatedTime: '5小时',
        mandatory: true,
        version: 'v1.8',
        effectiveDate: '2023-10-01'
      },
      {
        id: 8,
        title: '消防安全管理制度',
        category: 'safety',
        description: '消防设施管理、火灾预防和应急疏散程序',
        status: 'completed',
        progress: 100,
        lastStudied: '2024-01-03',
        estimatedTime: '2小时',
        mandatory: true,
        version: 'v2.0',
        effectiveDate: '2023-12-01'
      },
      {
        id: 9,
        title: '职业健康安全制度',
        category: 'safety',
        description: '员工职业健康保护和工作场所安全管理',
        status: 'completed',
        progress: 100,
        lastStudied: '2024-01-07',
        estimatedTime: '2.5小时',
        mandatory: true,
        version: 'v1.5',
        effectiveDate: '2023-11-15'
      },
      {
        id: 10,
        title: 'ISO质量管理体系',
        category: 'quality',
        description: 'ISO 9001质量管理体系文件和操作指南',
        status: 'in_progress',
        progress: 75,
        lastStudied: '2024-01-13',
        estimatedTime: '6小时',
        mandatory: true,
        version: 'v4.0',
        effectiveDate: '2024-01-01'
      },
      {
        id: 11,
        title: '产品质量控制规范',
        category: 'quality',
        description: '产品质量检验标准和质量控制流程',
        status: 'not_started',
        progress: 0,
        lastStudied: null,
        estimatedTime: '4小时',
        mandatory: true,
        version: 'v2.3',
        effectiveDate: '2023-12-01'
      },
      {
        id: 12,
        title: '数据保护与隐私政策',
        category: 'compliance',
        description: '个人数据保护、信息安全和隐私合规要求',
        status: 'completed',
        progress: 100,
        lastStudied: '2024-01-09',
        estimatedTime: '3小时',
        mandatory: true,
        version: 'v1.7',
        effectiveDate: '2023-12-01'
      }
    ]
  };

  // Filter documents by category
  const filteredDocuments = activeCategory === 'all' 
    ? handbookData.documents 
    : handbookData.documents.filter(doc => doc.category === activeCategory);

  // Get status color and icon
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'not_started': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'not_started': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'in_progress': return '学习中';
      case 'not_started': return '未开始';
      default: return '未知';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">公司规章制度学习</h2>
        <p className="text-gray-600">学习公司各类规章制度，确保合规操作</p>
      </div>

      {/* LearningStatistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{handbookData.stats.totalDocuments}</p>
                <p className="text-sm text-gray-600">制度文档</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{handbookData.stats.completedDocuments}</p>
                <p className="text-sm text-gray-600">已完成</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{handbookData.stats.studyHours}h</p>
                <p className="text-sm text-gray-600">学习时长</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{handbookData.stats.complianceRate}%</p>
                <p className="text-sm text-gray-600">合规率</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 分Class筛选 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>制度分类</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {handbookData.categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(category.id)}
                className="flex items-center space-x-1"
              >
                <span>{category.name}</span>
                <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">
                  {category.count}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 制度DocumentList */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredDocuments.map((doc) => (
          <Card key={doc.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{doc.title}</CardTitle>
                  <p className="text-sm text-gray-600 mb-3">{doc.description}</p>
                </div>
                {doc.mandatory && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                    必修
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* LearningProgress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">学习进度</span>
                    <span className="text-sm font-medium">{doc.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${doc.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* DocumentInfo */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">预计时长:</span>
                    <span className="ml-1 font-medium">{doc.estimatedTime}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">版本:</span>
                    <span className="ml-1 font-medium">{doc.version}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">生效日期:</span>
                    <span className="ml-1 font-medium">{doc.effectiveDate}</span>
                  </div>
                  {doc.lastStudied && (
                    <div>
                      <span className="text-gray-500">最近学习:</span>
                      <span className="ml-1 font-medium">{doc.lastStudied}</span>
                    </div>
                  )}
                </div>

                {/* Status和操作 */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                    {getStatusIcon(doc.status)}
                    <span>{getStatusText(doc.status)}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>预览</span>
                    </Button>
                    <Button size="sm" className="flex items-center space-x-1">
                      <BookOpen className="w-3 h-3" />
                      <span>{doc.status === 'completed' ? '复习' : doc.status === 'in_progress' ? '继续' : '开始'}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* LearningReminder */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span>学习提醒</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">📋 待完成学习</h4>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• 《薪酬福利制度》学习进度65%，建议本周内完成</li>
              <li>• 《化学品管理手册》需要继续学习，已完成40%</li>
              <li>• 《设备操作维护手册》为必修课程，请尽快开始学习</li>
              <li>• 《产品质量控制规范》即将到期，请及时安排学习</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HandbookPage;