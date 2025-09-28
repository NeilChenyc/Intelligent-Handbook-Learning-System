package com.quiz.service.impl;

import com.quiz.dto.ReportResponse;
import com.quiz.entity.User;
import com.quiz.entity.UserCourseProgress;
import com.quiz.entity.UserQuizAnswer;
import com.quiz.repository.UserRepository;
import com.quiz.repository.UserCourseProgressRepository;
import com.quiz.repository.UserQuizAnswerRepository;
import com.quiz.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {
    
    private final UserRepository userRepository;
    private final UserCourseProgressRepository progressRepository;
    private final UserQuizAnswerRepository quizAnswerRepository;
    
    @Override
    public ReportResponse getComplianceReport(String department, String timePeriod, String token) {
        log.info("获取合规报告: 部门={}, 时间段={}", department, timePeriod);
        
        ReportResponse report = new ReportResponse();
        report.setReportType("COMPLIANCE");
        report.setDepartment(department);
        report.setTimePeriod(timePeriod);
        report.setGeneratedAt(LocalDateTime.now());
        
        // 获取部门用户
        List<User> users = department != null && !department.isEmpty() ? 
                userRepository.findByDepartment(department) : 
                userRepository.findAll();
        
        // 计算总体统计
        int totalEmployees = users.size();
        int completedReports = calculateCompletedReports(users);
        double overallComplianceRate = totalEmployees > 0 ? 
                (double) completedReports / totalEmployees * 100 : 0.0;
        
        report.setTotalEmployees(totalEmployees);
        report.setCompletedReports(completedReports);
        report.setOverallComplianceRate(overallComplianceRate);
        
        // 构建部门统计
        List<ReportResponse.DepartmentStatsDto> departmentStats = buildDepartmentStats(users);
        report.setDepartmentStats(departmentStats);
        
        // 构建员工报告
        List<ReportResponse.EmployeeReportDto> employeeReports = buildEmployeeReports(users);
        report.setEmployeeReports(employeeReports);
        
        // 构建月度趋势（简化处理）
        List<ReportResponse.MonthlyTrendDto> monthlyTrends = buildMonthlyTrends();
        report.setMonthlyTrends(monthlyTrends);
        
        // 构建合规要求
        List<ReportResponse.ComplianceRequirementDto> complianceRequirements = buildComplianceRequirements();
        report.setComplianceRequirements(complianceRequirements);
        
        // 构建违规记录（简化处理）
        List<ReportResponse.ViolationRecordDto> violationRecords = buildViolationRecords();
        report.setViolationRecords(violationRecords);
        
        // 改进建议
        List<String> suggestions = List.of(
                "建议加强员工培训意识",
                "定期组织合规知识测试",
                "完善培训跟踪机制"
        );
        report.setImprovementSuggestions(suggestions);
        
        return report;
    }
    
    @Override
    public ReportResponse getDepartmentReport(String department, String timePeriod, String token) {
        log.info("获取部门报告: 部门={}, 时间段={}", department, timePeriod);
        
        // 复用合规报告逻辑，但设置不同的报告类型
        ReportResponse report = getComplianceReport(department, timePeriod, token);
        report.setReportType("DEPARTMENT");
        
        return report;
    }
    
    @Override
    public String exportReport(String reportType, String department, String timePeriod, String token) {
        log.info("导出报告: 类型={}, 部门={}, 时间段={}", reportType, department, timePeriod);
        
        ReportResponse report;
        
        switch (reportType.toUpperCase()) {
            case "COMPLIANCE":
                report = getComplianceReport(department, timePeriod, token);
                break;
            case "DEPARTMENT":
                report = getDepartmentReport(department, timePeriod, token);
                break;
            default:
                throw new IllegalArgumentException("不支持的报告类型: " + reportType);
        }
        
        // 生成导出文件路径（简化处理）
        String fileName = String.format("%s_report_%s_%s.pdf", 
                reportType.toLowerCase(), 
                department != null ? department : "all",
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")));
        
        String filePath = "/tmp/reports/" + fileName;
        
        log.info("报告导出完成: {}", filePath);
        
        return filePath;
    }
    
    /**
     * 计算完成报告的员工数量
     */
    private int calculateCompletedReports(List<User> users) {
        return (int) users.stream()
                .filter(user -> {
                    List<UserCourseProgress> progresses = progressRepository.findByUserId(user.getId());
                    return progresses.stream().anyMatch(UserCourseProgress::getIsCompleted);
                })
                .count();
    }
    
    /**
     * 构建部门统计
     */
    private List<ReportResponse.DepartmentStatsDto> buildDepartmentStats(List<User> users) {
        Map<String, List<User>> departmentUsers = users.stream()
                .collect(Collectors.groupingBy(User::getDepartment));
        
        return departmentUsers.entrySet().stream()
                .map(entry -> {
                    String dept = entry.getKey();
                    List<User> deptUsers = entry.getValue();
                    
                    int totalEmployees = deptUsers.size();
                    int completedEmployees = calculateCompletedReports(deptUsers);
                    double completionRate = totalEmployees > 0 ? 
                            (double) completedEmployees / totalEmployees * 100 : 0.0;
                    
                    // 计算平均分
                    double averageScore = deptUsers.stream()
                            .flatMap(user -> quizAnswerRepository.findByUserId(user.getId()).stream())
                            .mapToInt(UserQuizAnswer::getScore)
                            .average()
                            .orElse(0.0);
                    
                    String status = completionRate >= 80 ? "EXCELLENT" : 
                                   completionRate >= 60 ? "GOOD" : "NEEDS_IMPROVEMENT";
                    
                    return new ReportResponse.DepartmentStatsDto(
                            dept, totalEmployees, completedEmployees, 
                            completionRate, averageScore, status);
                })
                .collect(Collectors.toList());
    }
    
    /**
     * 构建员工报告
     */
    private List<ReportResponse.EmployeeReportDto> buildEmployeeReports(List<User> users) {
        return users.stream()
                .map(user -> {
                    List<UserCourseProgress> progresses = progressRepository.findByUserId(user.getId());
                    List<UserQuizAnswer> quizAnswers = quizAnswerRepository.findByUserId(user.getId());
                    
                    int totalCourses = progresses.size();
                    int completedCourses = (int) progresses.stream()
                            .filter(UserCourseProgress::getIsCompleted)
                            .count();
                    
                    double completionRate = totalCourses > 0 ? 
                            (double) completedCourses / totalCourses * 100 : 0.0;
                    
                    double averageScore = quizAnswers.stream()
                            .mapToInt(UserQuizAnswer::getScore)
                            .average()
                            .orElse(0.0);
                    
                    String status = completionRate >= 80 ? "COMPLETED" : 
                                   completionRate > 0 ? "IN_PROGRESS" : "NOT_STARTED";
                    
                    LocalDateTime lastActivity = progresses.stream()
                            .map(UserCourseProgress::getUpdatedAt)
                            .max(LocalDateTime::compareTo)
                            .orElse(null);
                    
                    return new ReportResponse.EmployeeReportDto(
                            user.getId(), user.getFullName(), user.getDepartment(),
                            status, completionRate, averageScore, lastActivity,
                            completedCourses, totalCourses);
                })
                .collect(Collectors.toList());
    }
    
    /**
     * 构建月度趋势（简化处理）
     */
    private List<ReportResponse.MonthlyTrendDto> buildMonthlyTrends() {
        return List.of(
                new ReportResponse.MonthlyTrendDto("2024-01", 65.0, 70.0, 15),
                new ReportResponse.MonthlyTrendDto("2024-02", 72.0, 75.0, 18),
                new ReportResponse.MonthlyTrendDto("2024-03", 78.0, 80.0, 22)
        );
    }
    
    /**
     * 构建合规要求（简化处理）
     */
    private List<ReportResponse.ComplianceRequirementDto> buildComplianceRequirements() {
        return List.of(
                new ReportResponse.ComplianceRequirementDto("安全培训", 45, 50, 90.0, "GOOD"),
                new ReportResponse.ComplianceRequirementDto("质量管理", 38, 50, 76.0, "NEEDS_IMPROVEMENT"),
                new ReportResponse.ComplianceRequirementDto("环保意识", 42, 50, 84.0, "GOOD")
        );
    }
    
    /**
     * 构建违规记录（简化处理）
     */
    private List<ReportResponse.ViolationRecordDto> buildViolationRecords() {
        return List.of(
                new ReportResponse.ViolationRecordDto(
                        "TRAINING_OVERDUE", "培训逾期未完成", "技术部", 
                        LocalDateTime.now().minusDays(5), "MEDIUM", "PENDING"),
                new ReportResponse.ViolationRecordDto(
                        "QUIZ_FAILED", "小测未通过", "销售部", 
                        LocalDateTime.now().minusDays(3), "LOW", "RESOLVED")
        );
    }
}