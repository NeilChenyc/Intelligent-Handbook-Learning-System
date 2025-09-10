import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Award, Download, Eye, Calendar, CheckCircle, Clock, Star, Shield, FileText, Building } from 'lucide-react';

const CertificatePage = () => {
  const [activeTab, setActiveTab] = useState('obtained');

  // 模拟公司内部学习认证数据
  const certificatesData = {
    obtained: [
      {
        id: 1,
        name: '员工手册合规认证',
        issuer: '人力资源部',
        issueDate: '2024-01-10',
        expiryDate: '2025-01-10',
        level: 'required',
        score: 95,
        credentialId: 'EHB-2024-001',
        skills: ['员工行为准则', '考勤制度', '薪酬福利', '培训发展'],
        status: 'active',
        category: 'compliance'
      },
      {
        id: 2,
        name: '实验室安全操作认证',
        issuer: '安全管理部',
        issueDate: '2024-01-05',
        expiryDate: '2025-01-05',
        level: 'required',
        score: 88,
        credentialId: 'LSO-2024-156',
        skills: ['安全操作规程', '化学品管理', '设备维护', '应急处理'],
        status: 'active',
        category: 'safety'
      },
      {
        id: 3,
        name: '信息安全管理认证',
        issuer: 'IT安全部',
        issueDate: '2024-01-08',
        expiryDate: '2025-01-08',
        level: 'required',
        score: 92,
        credentialId: 'ISM-2024-089',
        skills: ['数据保护', '网络安全', '访问控制', '隐私合规'],
        status: 'active',
        category: 'security'
      }
    ],
    inProgress: [
      {
        id: 4,
        name: 'ISO质量管理体系认证',
        issuer: '质量管理部',
        progress: 75,
        estimatedCompletion: '2024-02-28',
        requirements: [
          { name: '完成质量手册学习', completed: true },
          { name: '通过质量考核', completed: true },
          { name: '实践操作评估', completed: false },
          { name: '质量体系审核', completed: false }
        ],
        category: 'quality'
      },
      {
        id: 5,
        name: '职业健康安全认证',
        issuer: '安全管理部',
        progress: 60,
        estimatedCompletion: '2024-03-15',
        requirements: [
          { name: '健康安全培训', completed: true },
          { name: '风险评估学习', completed: true },
          { name: '防护用品使用', completed: false },
          { name: '应急演练参与', completed: false }
        ],
        category: 'safety'
      }
    ],
    available: [
      {
        id: 6,
        name: '产品质量控制认证',
        issuer: '质量管理部',
        difficulty: 'intermediate',
        duration: '4周',
        prerequisites: ['基础质量管理知识'],
        description: '掌握产品质量检验标准和控制流程',
        category: 'quality'
      },
      {
        id: 7,
        name: '化学品安全管理认证',
        issuer: '安全管理部',
        difficulty: 'advanced',
        duration: '6周',
        prerequisites: ['实验室安全操作认证'],
        description: '化学试剂的安全存储、使用和废料处理',
        category: 'safety'
      },
      {
        id: 8,
        name: '设备操作维护认证',
        issuer: '技术部',
        difficulty: 'advanced',
        duration: '8周',
        prerequisites: ['设备基础知识', '安全操作规程'],
        description: '掌握实验设备的标准操作和维护保养',
        category: 'technical'
      }
    ]
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'expert': return 'bg-purple-100 text-purple-800';
      case 'advanced': return 'bg-blue-100 text-blue-800';
      case 'intermediate': return 'bg-green-100 text-green-800';
      case 'beginner': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'expert': return 'text-purple-600';
      case 'advanced': return 'text-blue-600';
      case 'intermediate': return 'text-green-600';
      case 'beginner': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expiring': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">内部学习认证中心</h2>
        <p className="text-gray-600">管理和查看您的公司内部培训认证</p>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{certificatesData.obtained.length}</p>
                <p className="text-sm text-gray-600">已获得认证</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{certificatesData.inProgress.length}</p>
                <p className="text-sm text-gray-600">进行中</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{certificatesData.available.length}</p>
                <p className="text-sm text-gray-600">可申请</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">1</p>
                <p className="text-sm text-gray-600">即将过期</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 标签页导航 */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'obtained', label: '已获得证书', count: certificatesData.obtained.length },
              { id: 'inProgress', label: '进行中', count: certificatesData.inProgress.length },
              { id: 'available', label: '可申请', count: certificatesData.available.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 已获得认证 */}
      {activeTab === 'obtained' && (
        <div className="space-y-6">
          {certificatesData.obtained.map((cert) => (
            <Card key={cert.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      {cert.category === 'safety' ? (
                        <Shield className="w-8 h-8 text-red-500" />
                      ) : cert.category === 'compliance' ? (
                        <FileText className="w-8 h-8 text-blue-500" />
                      ) : cert.category === 'security' ? (
                        <Shield className="w-8 h-8 text-purple-500" />
                      ) : (
                        <Award className="w-8 h-8 text-yellow-500" />
                      )}
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{cert.name}</h3>
                        <p className="text-gray-600">{cert.issuer}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">颁发日期</p>
                        <p className="font-medium">{cert.issueDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">有效期至</p>
                        <p className="font-medium">{cert.expiryDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">认证编号</p>
                        <p className="font-medium">{cert.credentialId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">考试成绩</p>
                        <p className="font-medium">{cert.score}分</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 mb-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(cert.level)}`}>
                        {cert.level === 'required' ? '必修认证' : cert.level === 'advanced' ? '高级' : '中级'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(cert.status)}`}>
                        {cert.status === 'active' ? '有效' : cert.status === 'expiring' ? '即将过期' : '已过期'}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                        {cert.category === 'safety' ? '安全类' : cert.category === 'compliance' ? '合规类' : cert.category === 'security' ? '信息安全' : '其他'}
                      </span>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">技能标签</p>
                      <div className="flex flex-wrap gap-2">
                        {cert.skills.map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-6">
                    <Button size="sm" className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>查看</span>
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center space-x-1">
                      <Download className="w-4 h-4" />
                      <span>下载</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 进行中的认证 */}
      {activeTab === 'inProgress' && (
        <div className="space-y-6">
          {certificatesData.inProgress.map((cert) => (
            <Card key={cert.id}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span>{cert.name}</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded ml-2">
                    {cert.category === 'quality' ? '质量管理' : cert.category === 'safety' ? '安全类' : '其他'}
                  </span>
                </CardTitle>
                <p className="text-gray-600">{cert.issuer}</p>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>完成进度</span>
                    <span>{cert.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${cert.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">预计完成时间：{cert.estimatedCompletion}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">完成要求</p>
                  <div className="space-y-2">
                    {cert.requirements.map((req, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        {req.completed ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                        )}
                        <span className={`text-sm ${req.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                          {req.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 可申请认证 */}
      {activeTab === 'available' && (
        <div className="space-y-6">
          {certificatesData.available.map((cert) => (
            <Card key={cert.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {cert.category === 'safety' ? (
                      <Shield className="w-5 h-5 text-red-500" />
                    ) : cert.category === 'quality' ? (
                      <Award className="w-5 h-5 text-green-500" />
                    ) : cert.category === 'technical' ? (
                      <Building className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Star className="w-5 h-5 text-purple-500" />
                    )}
                    <span>{cert.name}</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded ml-2">
                      {cert.category === 'quality' ? '质量管理' : cert.category === 'safety' ? '安全类' : cert.category === 'technical' ? '技术类' : '其他'}
                    </span>
                  </div>
                  <span className={`text-sm font-medium ${getDifficultyColor(cert.difficulty)}`}>
                    {cert.difficulty === 'advanced' ? '高级' : cert.difficulty === 'intermediate' ? '中级' : '初级'}
                  </span>
                </CardTitle>
                <p className="text-gray-600">{cert.issuer}</p>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{cert.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">学习周期</p>
                    <p className="font-medium">{cert.duration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">前置要求</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cert.prerequisites.map((prereq, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {prereq}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <Button className="w-full md:w-auto">
                  申请学习
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CertificatePage;