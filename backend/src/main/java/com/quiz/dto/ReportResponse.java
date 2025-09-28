package com.quiz.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponse {
    
    private String reportType;
    private String department;
    private String timePeriod;
    private LocalDateTime generatedAt;
    
    // 总体统计
    private Integer totalEmployees;
    private Integer completedReports;
    private Double overallComplianceRate;
    
    // 部门统计
    private List<DepartmentStatsDto> departmentStats;
    
    // 员工详细报告
    private List<EmployeeReportDto> employeeReports;
    
    // 月度趋势
    private List<MonthlyTrendDto> monthlyTrends;
    
    // 合规要求完成情况
    private List<ComplianceRequirementDto> complianceRequirements;
    
    // 违规记录
    private List<ViolationRecordDto> violationRecords;
    
    // 改进建议
    private List<String> improvementSuggestions;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DepartmentStatsDto {
        private String department;
        private Integer totalEmployees;
        private Integer completedEmployees;
        private Double completionRate;
        private Double averageScore;
        private String status;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeeReportDto {
        private Long userId;
        private String name;
        private String department;
        private String status;
        private Double completionRate;
        private Double averageScore;
        private LocalDateTime lastActivity;
        private Integer completedCourses;
        private Integer totalCourses;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyTrendDto {
        private String month;
        private Double completionRate;
        private Double complianceRate;
        private Integer newCompletions;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComplianceRequirementDto {
        private String requirement;
        private Integer completedCount;
        private Integer totalCount;
        private Double completionRate;
        private String status;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ViolationRecordDto {
        private String type;
        private String description;
        private String department;
        private LocalDateTime occurredAt;
        private String severity;
        private String status;
    }
}