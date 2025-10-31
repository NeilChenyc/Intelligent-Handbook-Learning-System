import { API_BASE_URL } from '../config/api';

// Get organizational compliance report data
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

// Get department compliance statistics
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

// Get employee report details
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

// Get compliance category completion status
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

// Get monthly compliance trends
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