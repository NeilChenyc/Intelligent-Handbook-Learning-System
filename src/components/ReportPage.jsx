import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Progress } from './ui/Progress';
import { CheckCircle, AlertTriangle, Clock, FileText, Calendar, TrendingUp, Users, Building, Shield, Lightbulb } from 'lucide-react';

const ReportPage = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  // 模拟组织合规报告数据（管理员视角）
  const organizationData = {
    totalEmployees: 156,
    completedReports: 142,
    pendingReports: 14,
    overdueReports: 8,
    overallComplianceRate: 91,
    lastUpdated: '2024-01-15',
    
    // 部门统计
    departmentStats: [
      { name: '研发部', total: 45, completed: 42, pending: 3, overdue: 2, rate: 93 },
      { name: '市场部', total: 28, completed: 26, pending: 2, overdue: 1, rate: 93 },
      { name: '人事部', total: 15, completed: 15, pending: 0, overdue: 0, rate: 100 },
      { name: '财务部', total: 12, completed: 11, pending: 1, overdue: 0, rate: 92 },
      { name: '运营部', total: 32, completed: 28, pending: 4, overdue: 3, rate: 88 },
      { name: '质量部', total: 24, completed: 20, pending: 4, overdue: 2, rate: 83 }
    ],
    
    // 员工详细报告状态
    employeeReports: [
      { id: 1, name: '张三', department: '研发部', status: 'completed', score: 95, submitDate: '2024-01-10', dueDate: '2024-01-15' },
      { id: 2, name: '李四', department: '研发部', status: 'completed', score: 88, submitDate: '2024-01-12', dueDate: '2024-01-15' },
      { id: 3, name: '王五', department: '市场部', status: 'pending', score: null, submitDate: null, dueDate: '2024-01-15' },
      { id: 4, name: '赵六', department: '运营部', status: 'overdue', score: null, submitDate: null, dueDate: '2024-01-10' },
      { id: 5, name: '孙七', department: '人事部', status: 'completed', score: 92, submitDate: '2024-01-08', dueDate: '2024-01-15' },
      { id: 6, name: '周八', department: '财务部', status: 'completed', score: 87, submitDate: '2024-01-11', dueDate: '2024-01-15' },
      { id: 7, name: '吴九', department: '质量部', status: 'pending', score: null, submitDate: null, dueDate: '2024-01-15' },
      { id: 8, name: '郑十', department: '运营部', status: 'overdue', score: null, submitDate: null, dueDate: '2024-01-08' }
    ],
    
    monthlyTrend: [
      { month: '2023-08', rate: 85 },
      { month: '2023-09', rate: 88 },
      { month: '2023-10', rate: 86 },
      { month: '2023-11', rate: 92 },
      { month: '2023-12', rate: 89 },
      { month: '2024-01', rate: 91 }
    ],
    
    // 合规要求完成情况
    complianceCategories: [
      {
        id: 1,
        category: '员工手册学习',
        totalEmployees: 156,
        completed: 148,
        rate: 95,
        status: 'good',
        description: '员工手册相关规章制度学习完成情况'
      },
      {
        id: 2,
        category: '实验室安全培训',
        totalEmployees: 89, // 仅适用于实验室相关人员
        completed: 82,
        rate: 92,
        status: 'good',
        description: '实验室安全操作规程培训完成情况'
      },
      {
        id: 3,
        category: '信息安全意识',
        totalEmployees: 156,
        completed: 134,
        rate: 86,
        status: 'warning',
        description: '信息安全相关培训和考核完成情况'
      },
      {
        id: 4,
        category: '质量管理体系',
        totalEmployees: 78, // 仅适用于质量相关岗位
        completed: 71,
        rate: 91,
        status: 'good',
        description: '质量管理体系文档学习完成情况'
      }
    ],
    
    // 违规记录（组织层面）
    organizationViolations: [
      {
        id: 1,
        employee: '李四',
        department: '研发部',
        type: '培训逾期',
        severity: 'medium',
        date: '2024-01-05',
        description: '信息安全培训超过规定时间未完成',
        status: 'resolved',
        resolvedDate: '2024-01-08'
      },
      {
        id: 2,
        employee: '王五',
        department: '运营部',
        type: '报告延迟',
        severity: 'low',
        date: '2024-01-10',
        description: '月度合规报告提交延迟',
        status: 'in_progress',
        resolvedDate: null
      },
      {
        id: 3,
        employee: '赵六',
        department: '质量部',
        type: '文档未学习',
        severity: 'high',
        date: '2024-01-12',
        description: '质量管理体系文档学习未完成',
        status: 'pending',
        resolvedDate: null
      }
    ],
    
    // 改进建议（管理层面）
    managementRecommendations: [
      {
        id: 1,
        priority: 'high',
        title: '加强运营部合规培训',
        description: '运营部合规完成率较低，建议加强针对性培训和督导',
        estimatedImpact: '提升部门合规率至95%以上',
        targetDepartment: '运营部'
      },
      {
        id: 2,
        priority: 'medium',
        title: '建立合规提醒机制',
        description: '建立自动化提醒系统，在截止日期前提醒员工完成合规任务',
        estimatedImpact: '减少逾期情况30%',
        targetDepartment: '全公司'
      },
      {
        id: 3,
        priority: 'medium',
        title: '优化信息安全培训内容',
        description: '信息安全培训完成率偏低，建议优化培训内容和形式',
        estimatedImpact: '提升培训完成率至95%',
        targetDepartment: '全公司'
      }
    ]
  };

  // 筛选员工报告数据
  const filteredEmployeeReports = organizationData.employeeReports.filter(report => {
    if (selectedDepartment !== 'all' && report.department !== selectedDepartment) {
      return false;
    }
    return true;
  });

  const complianceData = {
    overall: {
      score: 92,
      status: 'excellent',
      lastUpdate: '2024-01-15'
    },
    requirements: [
      {
        id: 1,
        name: '必修课程完成度',
        required: 10,
        completed: 9,
        percentage: 90,
        status: 'good',
        deadline: '2024-03-31'
      },
      {
        id: 2,
        name: '安全培训认证',
        required: 4,
        completed: 4,
        percentage: 100,
        status: 'excellent',
        deadline: '2024-02-28'
      },
      {
        id: 3,
        name: '专业技能测试',
        required: 6,
        completed: 5,
        percentage: 83,
        status: 'good',
        deadline: '2024-04-15'
      },
      {
        id: 4,
        name: '合规考试通过',
        required: 3,
        completed: 2,
        percentage: 67,
        status: 'warning',
        deadline: '2024-03-15'
      }
    ],
    monthlyProgress: [
      { month: '10月', score: 85 },
      { month: '11月', score: 88 },
      { month: '12月', score: 90 },
      { month: '1月', score: 92 }
    ],
    violations: [
      {
        id: 1,
        type: '学习时长不足',
        description: '12月第2周学习时长未达到最低要求',
        severity: 'low',
        date: '2023-12-15',
        resolved: true
      },
      {
        id: 2,
        type: '测试延期提交',
        description: 'JavaScript进阶测试超过截止时间提交',
        severity: 'medium',
        date: '2024-01-08',
        resolved: false
      }
    ]
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'danger': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRateColor = (rate) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'good': return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'danger': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">组织合规报告</h2>
        <p className="text-gray-600">管理员视角 - 查看组织内所有员工的合规完成情况</p>
      </div>

      {/* 组织合规概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{organizationData.totalEmployees}</p>
                <p className="text-sm text-gray-600">总员工数</p>
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
                <p className="text-2xl font-bold text-gray-900">{organizationData.completedReports}</p>
                <p className="text-sm text-gray-600">已完成报告</p>
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
                <p className="text-2xl font-bold text-gray-900">{organizationData.pendingReports}</p>
                <p className="text-sm text-gray-600">待完成报告</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{organizationData.overdueReports}</p>
                <p className="text-sm text-gray-600">逾期报告</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 部门合规统计 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-blue-500" />
            <span>部门合规统计</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {organizationData.departmentStats.map((dept, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{dept.name}</h4>
                  <p className="text-sm text-gray-600">总人数: {dept.total} | 已完成: {dept.completed} | 待完成: {dept.pending} | 逾期: {dept.overdue}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        dept.rate >= 95 ? 'bg-green-500' : dept.rate >= 85 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${dept.rate}%` }}
                    ></div>
                  </div>
                  <span className={`font-bold ${getRateColor(dept.rate)}`}>{dept.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 月度合规趋势 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span>组织月度合规趋势</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {organizationData.monthlyTrend.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{item.month}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.rate}%` }}
                    ></div>
                  </div>
                  <span className="font-bold text-blue-600">{item.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 合规类别完成情况 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-green-500" />
            <span>合规类别完成情况</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {organizationData.complianceCategories.map((category) => (
              <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{category.category}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(category.status)}`}>
                      {category.status === 'good' ? '良好' : category.status === 'warning' ? '需关注' : '严重'}
                    </span>
                    <span className={`font-bold ${getRateColor(category.rate)}`}>{category.rate}%</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-3">{category.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">完成情况: {category.completed}/{category.totalEmployees}</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        category.rate >= 95 ? 'bg-green-500' : category.rate >= 85 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${category.rate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 员工报告详情 */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span>员工报告详情</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <select 
                value={selectedDepartment} 
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">所有部门</option>
                {organizationData.departmentStats.map(dept => (
                  <option key={dept.name} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">员工姓名</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">部门</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">状态</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">得分</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">提交日期</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">截止日期</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployeeReports.map((report) => (
                  <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{report.name}</td>
                    <td className="py-3 px-4 text-gray-600">{report.department}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status === 'completed' ? '已完成' : report.status === 'pending' ? '待完成' : '已逾期'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {report.score ? `${report.score}分` : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {report.submitDate || '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{report.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 组织违规记录 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>组织违规记录</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {organizationData.organizationViolations.map((violation) => (
              <div key={violation.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{violation.type}</h4>
                    <p className="text-sm text-gray-600">{violation.employee} - {violation.department}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      violation.severity === 'high' ? 'bg-red-100 text-red-800' :
                      violation.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {violation.severity === 'high' ? '高' : violation.severity === 'medium' ? '中' : '低'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      violation.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      violation.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {violation.status === 'resolved' ? '已解决' : violation.status === 'in_progress' ? '处理中' : '待处理'}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-2">{violation.description}</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>发生时间: {violation.date}</span>
                  {violation.resolvedDate && <span>解决时间: {violation.resolvedDate}</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 管理改进建议 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <span>管理改进建议</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {organizationData.managementRecommendations.map((rec) => (
              <div key={rec.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                    <p className="text-sm text-gray-500">目标部门: {rec.targetDepartment}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {rec.priority === 'high' ? '高优先级' : rec.priority === 'medium' ? '中优先级' : '低优先级'}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2">{rec.description}</p>
                <p className="text-blue-600 text-sm font-medium">预期效果: {rec.estimatedImpact}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportPage;