package com.quiz.service;

import com.quiz.dto.ReportResponse;

public interface ReportService {
    
    /**
     * 获取组织合规报告
     */
    ReportResponse getComplianceReport(String department, String timePeriod, String token);
    
    /**
     * 获取部门报告
     */
    ReportResponse getDepartmentReport(String department, String timePeriod, String token);
    
    /**
     * 导出报告
     */
    String exportReport(String reportType, String department, String timePeriod, String token);
}