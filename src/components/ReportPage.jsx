import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Progress } from './ui/Progress';
import { CheckCircle, AlertTriangle, Clock, FileText, Calendar, TrendingUp, Users, Building, Shield, Download } from 'lucide-react';
import { 
  getOrganizationReport, 
  getDepartmentStats, 
  getEmployeeReports, 
  getComplianceCategories
} from '../api/reportApi';

const ReportPage = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  
  // TODO: Translate - Fixed department list, consistent with other components
  const departments = [
    { value: 'all', label: 'All Departments' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Human Resources', label: 'Human Resources' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Operations', label: 'Operations' }
  ];
  
  // State management - data from API
  const [organizationData, setOrganizationData] = useState(null);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [employeeReports, setEmployeeReports] = useState([]);
  const [complianceCategories, setComplianceCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Export report functionality
  const exportReport = () => {
    const reportData = {
      organizationReport: organizationData,
      departmentStats,
      employeeReports: filteredEmployeeReports,
      complianceCategories,
      exportDate: new Date().toLocaleString('zh-CN')
    };

    const htmlTemplate = generateReportHTML(reportData);
    downloadHTML(htmlTemplate, `Compliance_Report_${new Date().toISOString().split('T')[0]}.html`);
  };

  // Generate report HTML template
  const generateReportHTML = (data) => {
    // Add data validation and debug info
    console.log('Export data:', data);
    
    // Ensure data exists, provide default values
    const orgData = data.organizationReport || {};
    const deptStats = data.departmentStats || [];
    const empReports = data.employeeReports || [];
    const compCategories = data.complianceCategories || [];
    
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
            line-height: 1.6;
            color: #1a202c;
            background: #ffffff;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 3rem 2rem;
        }
        
        .header {
            text-align: center;
            margin-bottom: 4rem;
            padding: 3rem 2rem;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            position: relative;
        }
        
        .header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 2px;
            background: #2d3748;
        }
        
        .header-content {
            position: relative;
            z-index: 1;
        }
        
        .header h1 {
            font-size: 2.5rem;
            font-weight: 300;
            margin-bottom: 1rem;
            color: #1a202c;
            letter-spacing: -0.02em;
        }
        
        .header .subtitle {
            font-size: 1rem;
            color: #4a5568;
            margin-bottom: 1rem;
            font-weight: 400;
        }
        
        .header .timestamp {
            font-size: 0.875rem;
            color: #718096;
            font-weight: 300;
        }
        
        .overview {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 2rem;
            margin-bottom: 4rem;
        }
        
        .metric-card {
            background: #ffffff;
            padding: 2.5rem 2rem;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            transition: all 0.2s ease;
            position: relative;
        }
        
        .metric-card:hover {
            border-color: #cbd5e0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        
        .metric-card h3 {
            font-size: 0.75rem;
            font-weight: 500;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 1rem;
        }
        
        .metric-number {
            font-size: 3rem;
            font-weight: 200;
            color: #1a202c;
            margin-bottom: 0.5rem;
            line-height: 1;
        }
        
        .metric-label {
            font-size: 0.875rem;
            color: #4a5568;
            font-weight: 400;
        }
        
        .section {
            background: #ffffff;
            margin-bottom: 3rem;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .section-header {
            background: #ffffff;
            padding: 2rem;
            border-bottom: 1px solid #f7fafc;
        }
        
        .section-header h2 {
            font-size: 1.125rem;
            font-weight: 400;
            color: #1a202c;
            display: flex;
            align-items: center;
        }
        
        .section-icon {
            width: 6px;
            height: 6px;
            background: #2d3748;
            border-radius: 50%;
            margin-right: 1rem;
        }
        
        .section-content {
            padding: 2rem;
        }
        
        .dept-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem 0;
            border-bottom: 1px solid #f7fafc;
            transition: all 0.2s ease;
        }
        
        .dept-item:hover {
            background: #f8fafc;
            margin: 0 -2rem;
            padding-left: 2rem;
            padding-right: 2rem;
        }
        
        .dept-item:last-child {
            border-bottom: none;
        }
        
        .dept-info h4 {
            font-size: 1rem;
            font-weight: 500;
            color: #1a202c;
            margin-bottom: 0.25rem;
        }
        
        .dept-info p {
            font-size: 0.875rem;
            color: #718096;
        }
        
        .dept-stats {
            text-align: right;
        }
        
        .completion-rate {
            font-size: 1.25rem;
            font-weight: 300;
            color: #1a202c;
            margin-bottom: 0.25rem;
        }
        
        .progress-bar {
            width: 120px;
            height: 4px;
            background: #f7fafc;
            border-radius: 2px;
            overflow: hidden;
            margin-left: auto;
        }
        
        .progress-fill {
            height: 100%;
            background: #2d3748;
            transition: width 0.3s ease;
        }
        
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
        }
        
        .table th {
            background: #f8fafc;
            padding: 1rem;
            text-align: left;
            font-weight: 500;
            font-size: 0.875rem;
            color: #4a5568;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .table td {
            padding: 1rem;
            border-bottom: 1px solid #f7fafc;
            font-size: 0.875rem;
            color: #2d3748;
        }
        
        .table tr:hover {
            background: #f8fafc;
        }
        
        .status-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .status-completed {
            background: #f0fff4;
            color: #22543d;
            border: 1px solid #c6f6d5;
        }
        
        .status-pending {
            background: #fffbf0;
            color: #744210;
            border: 1px solid #fbd38d;
        }
        
        .status-overdue {
            background: #fff5f5;
            color: #742a2a;
            border: 1px solid #fed7d7;
        }
        
        .footer {
            text-align: center;
            margin-top: 4rem;
            padding: 2rem;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 0.875rem;
        }
        
        .footer strong {
            color: #2d3748;
            font-weight: 500;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 2rem 1rem;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .overview {
                grid-template-columns: 1fr;
                gap: 1rem;
            }
            
            .dept-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 1rem;
            }
            
            .dept-stats {
                text-align: left;
                width: 100%;
            }
            
            .progress-bar {
                margin-left: 0;
            }
        }
        
        @media print {
            body {
                background: white;
            }
            
            .container {
                max-width: none;
                padding: 1rem;
            }
            
            .metric-card,
            .section {
                box-shadow: none;
                border: 1px solid #e2e8f0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-content">
                <h1>Organization Compliance Report</h1>
                <p class="subtitle">Administrator View - Monitor compliance completion status for all employees in the organization</p>
                <p class="timestamp">Generated on ${new Date().toLocaleDateString('zh-CN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
            </div>
        </div>

        <div class="overview">
            <div class="metric-card">
                <h3>Total Employees</h3>
                <div class="metric-number">${orgData.totalEmployees || 0}</div>
                <div class="metric-label">Active Users</div>
            </div>
            <div class="metric-card">
                <h3>Completed Reports</h3>
                <div class="metric-number">${orgData.completedReports || 0}</div>
                <div class="metric-label">Submissions</div>
            </div>
            <div class="metric-card">
                <h3>Pending Reports</h3>
                <div class="metric-number">${orgData.pendingReports || 0}</div>
                <div class="metric-label">Outstanding</div>
            </div>
        </div>

        <div class="section">
            <div class="section-header">
                <h2><span class="section-icon"></span>Department Compliance Statistics</h2>
            </div>
            <div class="section-content">
                ${deptStats.length > 0 ? deptStats.map(dept => `
                    <div class="dept-item">
                        <div class="dept-info">
                            <h4>${dept.department || dept.name || 'Unknown Department'}</h4>
                            <p>${dept.totalEmployees || dept.total || 0} employees</p>
                        </div>
                        <div class="dept-stats">
                            <div class="completion-rate">${dept.completionRate || dept.rate || 0}%</div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${dept.completionRate || dept.rate || 0}%"></div>
                            </div>
                        </div>
                    </div>
                `).join('') : '<p>No department data available</p>'}
            </div>
        </div>

        <div class="section">
            <div class="section-header">
                <h2><span class="section-icon"></span>Employee Report Details</h2>
            </div>
            <div class="section-content">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Employee Name</th>
                            <th>Department</th>
                            <th>Completion Status</th>
                            <th>Last Updated</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${empReports.length > 0 ? empReports.map(emp => `
                            <tr>
                                <td>${emp.employeeName || emp.name || 'Unknown'}</td>
                                <td>${emp.department || 'Unknown'}</td>
                                <td>
                                    <span class="status-badge status-${(emp.status || 'pending').toLowerCase()}">
                                        ${emp.status || 'Pending'}
                                    </span>
                                </td>
                                <td>${emp.lastUpdated ? new Date(emp.lastUpdated).toLocaleDateString('zh-CN') : (emp.submitDate || 'N/A')}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="4">No employee data available</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="section">
            <div class="section-header">
                <h2><span class="section-icon"></span>Compliance Categories</h2>
            </div>
            <div class="section-content">
                ${compCategories.length > 0 ? compCategories.map(category => `
                    <div class="dept-item">
                        <div class="dept-info">
                            <h4>${category.category || category.name || 'Unknown Category'}</h4>
                            <p>${category.description || 'No description available'}</p>
                        </div>
                        <div class="dept-stats">
                            <div class="completion-rate">${category.completionRate || category.rate || 0}%</div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${category.completionRate || category.rate || 0}%"></div>
                            </div>
                        </div>
                    </div>
                `).join('') : '<p>No compliance category data available</p>'}
            </div>
        </div>

        <div class="footer">
            <p><strong>Intelligent Handbook Learning System</strong></p>
            <p>This report contains confidential information. Please handle with appropriate care.</p>
        </div>
    </div>
</body>
</html>
    `;
  };

  // Download HTML file
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
        
        // Get all data in parallel
        const [
          orgData,
          deptStats,
          empReports,
          compCategories
        ] = await Promise.all([
          getOrganizationReport(),
          getDepartmentStats(),
          getEmployeeReports(),
          getComplianceCategories()
        ]);

        setOrganizationData(orgData);
        setDepartmentStats(Array.isArray(deptStats?.departmentStats) ? deptStats.departmentStats : []);
        setEmployeeReports(Array.isArray(empReports?.employeeReports) ? empReports.employeeReports : []);
        setComplianceCategories(Array.isArray(compCategories?.complianceCategories) ? compCategories.complianceCategories : []);
        
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Refetch employee reports when department filter changes
  useEffect(() => {
    const fetchEmployeeReports = async () => {
      try {
        const department = selectedDepartment === 'all' ? null : selectedDepartment;
        const empReports = await getEmployeeReports(department);
        setEmployeeReports(Array.isArray(empReports?.employeeReports) ? empReports.employeeReports : []);
      } catch (err) {
        console.error('Error fetching employee reports:', err);
        setEmployeeReports([]); // Set to empty array on error
      }
    };

    if (!loading && organizationData) {
      fetchEmployeeReports();
    }
  }, [selectedDepartment, loading, organizationData]);

  // Filter employee report data
  const filteredEmployeeReports = Array.isArray(employeeReports) ? employeeReports.filter(report => {
    if (selectedDepartment !== 'all' && report.department !== selectedDepartment) {
      return false;
    }
    return true;
  }) : [];

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  // If no data
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

      {/* 组织Compliance概览 */}
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

        {/* ReportDownloadButton */}
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

      {/* 部门ComplianceStatistics */}
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



      {/* ComplianceClass别完成情况 */}
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
                <p className="text-gray-600 text-sm mb-3" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>{category.description}</p>
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

      {/* 员工ReportDetails */}
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