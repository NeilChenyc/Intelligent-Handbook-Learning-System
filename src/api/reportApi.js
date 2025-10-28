const API_BASE_URL = 'http://localhost:8080';

// 获取组织合规报告数据
export const getOrganizationReport = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/reports/organization`);
    if (!response.ok) {
      throw new Error('Failed to fetch organization report');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching organization report:', error);
    throw error;
  }
};

// 获取部门合规统计
export const getDepartmentStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/reports/departments`);
    if (!response.ok) {
      throw new Error('Failed to fetch department stats');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching department stats:', error);
    throw error;
  }
};

// 获取员工报告详情
export const getEmployeeReports = async (department = null) => {
  try {
    const url = department 
      ? `${API_BASE_URL}/reports/employees?department=${encodeURIComponent(department)}`
      : `${API_BASE_URL}/reports/employees`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch employee reports');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching employee reports:', error);
    throw error;
  }
};

// 获取合规类别完成情况
export const getComplianceCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/reports/compliance-categories`);
    if (!response.ok) {
      throw new Error('Failed to fetch compliance categories');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching compliance categories:', error);
    throw error;
  }
};

// 获取月度合规趋势
export const getMonthlyTrend = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/reports/monthly-trend`);
    if (!response.ok) {
      throw new Error('Failed to fetch monthly trend');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching monthly trend:', error);
    throw error;
  }
};