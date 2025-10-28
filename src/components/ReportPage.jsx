import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Progress } from './ui/Progress';
import { CheckCircle, AlertTriangle, Clock, FileText, Calendar, TrendingUp, Users, Building, Shield, Download } from 'lucide-react';
import { 
  getOrganizationReport, 
  getDepartmentStats, 
  getEmployeeReports, 
  getComplianceCategories, 
  getMonthlyTrend 
} from '../api/reportApi';

const ReportPage = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  
  // 固定的部门列表，与其他组件保持一致
  const departments = [
    { value: 'all', label: 'All Departments' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Human Resources', label: 'Human Resources' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Operations', label: 'Operations' }
  ];
  
  // 状态管理 - 从API获取的数据
  const [organizationData, setOrganizationData] = useState(null);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [employeeReports, setEmployeeReports] = useState([]);
  const [complianceCategories, setComplianceCategories] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 导出报告功能
  const exportReport = () => {
    const reportData = {
      organizationData,
      departmentStats,
      employeeReports: filteredEmployeeReports,
      complianceCategories,
      monthlyTrend,
      exportDate: new Date().toLocaleString('zh-CN')
    };

    const htmlTemplate = generateReportHTML(reportData);
    downloadHTML(htmlTemplate, `Compliance_Report_${new Date().toISOString().split('T')[0]}.html`);
  };

  // 生成报告HTML模板
  const generateReportHTML = (data) => {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Organization Compliance Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.7;
            color: #2d3748;
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .header {
            text-align: center;
            margin-bottom: 3rem;
            padding: 3rem 2rem;
            background: linear-gradient(135deg, #4299e1 0%, #3182ce 50%, #2b77cb 100%);
            color: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(66, 153, 225, 0.3);
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="20" cy="80" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            pointer-events: none;
        }
        
        .header-content {
            position: relative;
            z-index: 1;
        }
        
        .header h1 {
            font-size: 2.75rem;
            font-weight: 700;
            margin-bottom: 0.75rem;
            letter-spacing: -0.025em;
        }
        
        .header .subtitle {
            font-size: 1.125rem;
            opacity: 0.9;
            margin-bottom: 0.5rem;
            font-weight: 400;
        }
        
        .header .timestamp {
            font-size: 0.95rem;
            opacity: 0.8;
            font-weight: 300;
        }
        
        .overview {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
        }
        
        .metric-card {
            background: white;
            padding: 2rem;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(226, 232, 240, 0.8);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .metric-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #4299e1, #3182ce);
        }
        
        .metric-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }
        
        .metric-card h3 {
            font-size: 0.875rem;
            font-weight: 600;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.75rem;
        }
        
        .metric-number {
            font-size: 2.5rem;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 0.25rem;
            line-height: 1;
        }
        
        .metric-label {
            font-size: 1rem;
            color: #4a5568;
            font-weight: 500;
        }
        
        .section {
            background: white;
            margin-bottom: 2rem;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(226, 232, 240, 0.8);
            overflow: hidden;
        }
        
        .section-header {
            background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
            padding: 1.5rem 2rem;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .section-header h2 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #2d3748;
            display: flex;
            align-items: center;
        }
        
        .section-icon {
            width: 8px;
            height: 8px;
            background: #4299e1;
            border-radius: 50%;
            margin-right: 0.75rem;
        }
        
        .section-content {
            padding: 2rem;
        }
        
        .dept-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.25rem 1.5rem;
            margin-bottom: 0.75rem;
            background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
            border-radius: 12px;
            border-left: 4px solid #48bb78;
            transition: all 0.2s ease;
        }
        
        .dept-item:hover {
            transform: translateX(4px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .dept-item:last-child {
            margin-bottom: 0;
        }
        
        .dept-info h4 {
            font-size: 1.125rem;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 0.25rem;
        }
        
        .dept-info p {
            font-size: 0.875rem;
            color: #718096;
            line-height: 1.5;
        }
        
        .dept-stats {
            text-align: right;
            min-width: 140px;
        }
        
        .dept-percentage {
            font-size: 1.25rem;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 0.5rem;
        }
        
        .progress-container {
            width: 120px;
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
            margin-left: auto;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #48bb78, #38a169);
            border-radius: 4px;
            transition: width 0.6s ease;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
        }
        
        .data-table th {
            background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
            padding: 1rem 1.25rem;
            text-align: left;
            font-weight: 600;
            color: #4a5568;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .data-table td {
            padding: 1rem 1.25rem;
            border-bottom: 1px solid #f1f5f9;
            font-size: 0.9375rem;
            color: #4a5568;
        }
        
        .data-table tr:hover {
            background: #f8fafc;
        }
        
        .status-badge {
            display: inline-flex;
            align-items: center;
            padding: 0.375rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .status-completed {
            background: linear-gradient(135deg, #c6f6d5, #9ae6b4);
            color: #22543d;
        }
        
        .status-pending {
            background: linear-gradient(135deg, #fef5e7, #fed7aa);
            color: #c05621;
        }
        
        .footer {
            text-align: center;
            margin-top: 3rem;
            padding: 2rem;
            color: #718096;
            font-size: 0.875rem;
            line-height: 1.6;
        }
        
        .footer p {
            margin-bottom: 0.5rem;
        }
        
        .footer p:last-child {
            margin-bottom: 0;
        }
        
        /* 响应式设计 */
        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }
            
            .header {
                padding: 2rem 1.5rem;
                margin-bottom: 2rem;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .overview {
                grid-template-columns: 1fr;
                gap: 1rem;
            }
            
            .metric-card {
                padding: 1.5rem;
            }
            
            .section-content {
                padding: 1.5rem;
            }
            
            .dept-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 1rem;
            }
            
            .dept-stats {
                align-self: stretch;
                text-align: left;
            }
            
            .progress-container {
                width: 100%;
                margin-left: 0;
            }
        }
        
        /* 打印样式 */
        @media print {
            body {
                background: white;
                color: #000;
            }
            
            .container {
                max-width: none;
                padding: 0;
            }
            
            .header {
                background: #4299e1 !important;
                box-shadow: none;
                page-break-inside: avoid;
            }
            
            .section, .metric-card {
                box-shadow: none;
                border: 1px solid #e2e8f0;
                page-break-inside: avoid;
            }
            
            .dept-item:hover {
                transform: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-content">
                <h1>Organization Compliance Report</h1>
                <p class="subtitle">Administrator View - Monitor compliance completion status for all employees</p>
                <p class="timestamp">Generated on: ${data.exportDate}</p>
            </div>
        </div>

        <div class="overview">
            <div class="metric-card">
                <h3>Total Employees</h3>
                <div class="metric-number">${data.organizationData?.totalEmployees || 0}</div>
                <div class="metric-label">Active Users</div>
            </div>
            <div class="metric-card">
                <h3>Completed Reports</h3>
                <div class="metric-number">${data.organizationData?.completedReports || 0}</div>
                <div class="metric-label">Finished Tasks</div>
            </div>
            <div class="metric-card">
                <h3>Pending Reports</h3>
                <div class="metric-number">${data.organizationData?.pendingReports || 0}</div>
                <div class="metric-label">Awaiting Completion</div>
            </div>
            <div class="metric-card">
                <h3>Completion Rate</h3>
                <div class="metric-number">${data.organizationData?.completionRate || 0}%</div>
                <div class="metric-label">Overall Progress</div>
            </div>
        </div>

        <div class="section">
            <div class="section-header">
                <h2><span class="section-icon"></span>Department Compliance Statistics</h2>
            </div>
            <div class="section-content">
                ${data.departmentStats.map(dept => `
                    <div class="dept-item">
                        <div class="dept-info">
                            <h4>${dept.name}</h4>
                            <p>Total: ${dept.total} employees • Completed: ${dept.completed} • Pending: ${dept.pending}</p>
                        </div>
                        <div class="dept-stats">
                            <div class="dept-percentage">${dept.rate}%</div>
                            <div class="progress-container">
                                <div class="progress-fill" style="width: ${dept.rate}%"></div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <div class="section-header">
                <h2><span class="section-icon"></span>Employee Report Details</h2>
            </div>
            <div class="section-content">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Employee Name</th>
                            <th>Department</th>
                            <th>Status</th>
                            <th>Score</th>
                            <th>Submit Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.employeeReports.map(report => `
                            <tr>
                                <td><strong>${report.name}</strong></td>
                                <td>${report.department}</td>
                                <td>
                                    <span class="status-badge ${report.status === 'completed' ? 'status-completed' : 'status-pending'}">
                                        ${report.status === 'completed' ? 'Completed' : 'Pending'}
                                    </span>
                                </td>
                                <td>${report.score ? '<strong>' + report.score + '</strong> Points' : '—'}</td>
                                <td>${report.submitDate || '—'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="section">
            <div class="section-header">
                <h2><span class="section-icon"></span>Compliance Categories Overview</h2>
            </div>
            <div class="section-content">
                ${data.complianceCategories.map(category => `
                    <div class="dept-item">
                        <div class="dept-info">
                            <h4>${category.category}</h4>
                            <p>${category.description}</p>
                            <p><strong>Progress:</strong> ${category.completed} of ${category.totalEmployees} employees completed</p>
                        </div>
                        <div class="dept-stats">
                            <div class="dept-percentage">${category.rate}%</div>
                            <div class="progress-container">
                                <div class="progress-fill" style="width: ${category.rate}%"></div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="footer">
            <p><strong>Compliance Management System</strong></p>
            <p>This report was automatically generated and contains confidential information.</p>
            <p>For questions or concerns, please contact the system administrator.</p>
        </div>
    </div>
</body>
</html>`;
  };

  // 下载HTML文件
  const downloadHTML = (htmlContent, filename) => {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 并行获取所有数据
        const [
          orgData,
          deptStats,
          empReports,
          compCategories,
          monthTrend
        ] = await Promise.all([
          getOrganizationReport(),
          getDepartmentStats(),
          getEmployeeReports(),
          getComplianceCategories(),
          getMonthlyTrend()
        ]);

        setOrganizationData(orgData);
        setDepartmentStats(Array.isArray(deptStats?.departmentStats) ? deptStats.departmentStats : []);
        setEmployeeReports(Array.isArray(empReports?.employeeReports) ? empReports.employeeReports : []);
        setComplianceCategories(Array.isArray(compCategories?.complianceCategories) ? compCategories.complianceCategories : []);
        setMonthlyTrend(Array.isArray(monthTrend?.monthlyTrend) ? monthTrend.monthlyTrend : []);
        
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 当部门筛选改变时重新获取员工报告
  useEffect(() => {
    const fetchEmployeeReports = async () => {
      try {
        const department = selectedDepartment === 'all' ? null : selectedDepartment;
        const empReports = await getEmployeeReports(department);
        setEmployeeReports(Array.isArray(empReports?.employeeReports) ? empReports.employeeReports : []);
      } catch (err) {
        console.error('Error fetching employee reports:', err);
        setEmployeeReports([]); // 出错时设置为空数组
      }
    };

    if (!loading && organizationData) {
      fetchEmployeeReports();
    }
  }, [selectedDepartment, loading, organizationData]);

  // 筛选员工报告数据
  const filteredEmployeeReports = Array.isArray(employeeReports) ? employeeReports.filter(report => {
    if (selectedDepartment !== 'all' && report.department !== selectedDepartment) {
      return false;
    }
    return true;
  }) : [];

  // 加载状态
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">加载中...</div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">加载数据时出错: {error}</div>
        </div>
      </div>
    );
  }

  // 如果没有数据
  if (!organizationData) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">暂无数据</div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
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
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Organization Compliance Report</h2>
        <p className="text-gray-600">Administrator View - Monitor compliance completion status for all employees in the organization</p>
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
                <p className="text-2xl font-bold text-gray-900">{organizationData?.totalEmployees || 0}</p>
                <p className="text-sm text-gray-600">Total Employees</p>
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
                <p className="text-2xl font-bold text-gray-900">{organizationData?.completedReports || 0}</p>
                <p className="text-sm text-gray-600">Completed Reports</p>
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
                <p className="text-2xl font-bold text-gray-900">{organizationData?.pendingReports || 0}</p>
                <p className="text-sm text-gray-600">Pending Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 报告下载按钮 */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={exportReport}>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="p-3 bg-purple-100 rounded-lg mx-auto mb-3 w-fit">
                  <Download className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-lg font-bold text-gray-900 mb-1">Export Report</p>
                <p className="text-sm text-gray-600">Download HTML</p>
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
            <span>Department Compliance Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departmentStats.map((dept, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{dept.name}</h4>
                  <p className="text-sm text-gray-600">Total: {dept.total} | Completed: {dept.completed} | Pending: {dept.pending}</p>
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
            <span>Monthly Compliance Trend</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyTrend.map((item, index) => (
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
            <span>Compliance Category Completion Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complianceCategories.map((category) => (
              <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{category.category}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(category.status)}`}>
                      {category.status === 'good' ? 'Good' : category.status === 'warning' ? 'Needs Attention' : 'Critical'}
                    </span>
                    <span className={`font-bold ${getRateColor(category.rate)}`}>{category.rate}%</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-3">{category.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Completion Status: {category.completed}/{category.totalEmployees}</span>
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
              <span>Employee Report Details</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <select 
                value={selectedDepartment} 
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                {departments.map(dept => (
                  <option key={dept.value} value={dept.value}>{dept.label}</option>
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
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Department</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Severity</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Occurrence Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployeeReports.map((report) => (
                  <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{report.name}</td>
                    <td className="py-3 px-4 text-gray-600">{report.department}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {report.score ? `${report.score} Points` : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {report.submitDate || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>



    </div>
  );
};

export default ReportPage;