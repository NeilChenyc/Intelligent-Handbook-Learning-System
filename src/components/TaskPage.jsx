import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { CheckCircle, Clock, AlertCircle, Plus, Calendar, User, Tag, Filter } from 'lucide-react';

const TaskPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // 模拟任务数据
  const tasksData = [
    {
      id: 1,
      title: '完成员工手册学习',
      description: '阅读并完成员工手册相关章节的学习测试',
      status: 'completed',
      priority: 'high',
      dueDate: '2024-01-15',
      completedDate: '2024-01-14',
      assignee: '张三',
      category: '学习任务',
      progress: 100,
      tags: ['员工手册', '必修']
    },
    {
      id: 2,
      title: '实验室安全培训',
      description: '参加实验室安全操作规程培训并通过考核',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2024-01-20',
      assignee: '李四',
      category: '培训任务',
      progress: 65,
      tags: ['实验室', '安全培训']
    },
    {
      id: 3,
      title: '月度合规报告提交',
      description: '提交本月度的合规自查报告',
      status: 'pending',
      priority: 'medium',
      dueDate: '2024-01-25',
      assignee: '王五',
      category: '报告任务',
      progress: 0,
      tags: ['合规', '月报']
    },
    {
      id: 4,
      title: '信息安全意识培训',
      description: '完成信息安全相关课程学习',
      status: 'overdue',
      priority: 'high',
      dueDate: '2024-01-10',
      assignee: '赵六',
      category: '学习任务',
      progress: 30,
      tags: ['信息安全', '必修']
    },
    {
      id: 5,
      title: '质量管理体系文档审核',
      description: '审核并确认质量管理体系相关文档',
      status: 'in_progress',
      priority: 'medium',
      dueDate: '2024-01-30',
      assignee: '孙七',
      category: '审核任务',
      progress: 45,
      tags: ['质量管理', '文档审核']
    },
    {
      id: 6,
      title: '新员工入职培训',
      description: '为新入职员工安排入职培训课程',
      status: 'pending',
      priority: 'low',
      dueDate: '2024-02-05',
      assignee: '周八',
      category: '培训任务',
      progress: 0,
      tags: ['入职培训', '新员工']
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'overdue': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const filteredTasks = tasksData.filter(task => {
    if (activeTab !== 'all' && task.status !== activeTab) return false;
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    return true;
  });

  const taskStats = {
    total: tasksData.length,
    completed: tasksData.filter(t => t.status === 'completed').length,
    in_progress: tasksData.filter(t => t.status === 'in_progress').length,
    pending: tasksData.filter(t => t.status === 'pending').length,
    overdue: tasksData.filter(t => t.status === 'overdue').length
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">任务管理</h2>
            <p className="text-gray-600">管理和跟踪学习培训任务</p>
          </div>
          <Button className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>新建任务</span>
          </Button>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{taskStats.total}</p>
                <p className="text-sm text-gray-600">总任务</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{taskStats.completed}</p>
                <p className="text-sm text-gray-600">已完成</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{taskStats.in_progress}</p>
                <p className="text-sm text-gray-600">进行中</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{taskStats.pending}</p>
                <p className="text-sm text-gray-600">待开始</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{taskStats.overdue}</p>
                <p className="text-sm text-gray-600">已逾期</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和标签页 */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'all', label: '全部任务', count: taskStats.total },
                { id: 'pending', label: '待开始', count: taskStats.pending },
                { id: 'in_progress', label: '进行中', count: taskStats.in_progress },
                { id: 'completed', label: '已完成', count: taskStats.completed },
                { id: 'overdue', label: '已逾期', count: taskStats.overdue }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">所有状态</option>
              <option value="pending">待开始</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
              <option value="overdue">已逾期</option>
            </select>
          </div>
        </div>
      </div>

      {/* 任务列表 */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    {getStatusIcon(task.status)}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">负责人</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <p className="font-medium text-sm">{task.assignee}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">截止日期</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <p className="font-medium text-sm">{task.dueDate}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">任务类型</p>
                      <p className="font-medium text-sm mt-1">{task.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">完成进度</p>
                      <div className="mt-1">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${task.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{task.progress}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status === 'completed' ? '已完成' : 
                         task.status === 'in_progress' ? '进行中' : 
                         task.status === 'overdue' ? '已逾期' : '待开始'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority === 'high' ? '高优先级' : 
                         task.priority === 'medium' ? '中优先级' : '低优先级'}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {task.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-2 ml-6">
                  <Button size="sm" variant="outline">
                    查看详情
                  </Button>
                  {task.status !== 'completed' && (
                    <Button size="sm">
                      {task.status === 'pending' ? '开始任务' : '继续任务'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Tag className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无任务</h3>
          <p className="text-gray-500">当前筛选条件下没有找到任务</p>
        </div>
      )}
    </div>
  );
};

export default TaskPage;