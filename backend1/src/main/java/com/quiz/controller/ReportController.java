package com.quiz.controller;

import com.quiz.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class ReportController {

    private final ReportService reportService;

    /**
     * Get organization compliance report data
     */
    @GetMapping("/organization")
    public ResponseEntity<Map<String, Object>> getOrganizationReport() {
        try {
            Map<String, Object> reportData = reportService.getOrganizationReportData();
            return ResponseEntity.ok(reportData);
        } catch (Exception e) {
            log.error("Error fetching organization report", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get department compliance statistics
     */
    @GetMapping("/departments")
    public ResponseEntity<Map<String, Object>> getDepartmentStats() {
        try {
            Map<String, Object> departmentStats = reportService.getDepartmentStats();
            return ResponseEntity.ok(departmentStats);
        } catch (Exception e) {
            log.error("Error fetching department stats", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get employee report details
     */
    @GetMapping("/employees")
    public ResponseEntity<Map<String, Object>> getEmployeeReports(
            @RequestParam(value = "department", required = false) String department) {
        try {
            Map<String, Object> employeeReports = reportService.getEmployeeReports(department);
            return ResponseEntity.ok(employeeReports);
        } catch (Exception e) {
            log.error("Error fetching employee reports", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /* * * GetComplianceClass别完成情况 */
    @GetMapping("/compliance-categories")
    public ResponseEntity<Map<String, Object>> getComplianceCategories() {
        try {
            Map<String, Object> complianceCategories = reportService.getComplianceCategories();
            return ResponseEntity.ok(complianceCategories);
        } catch (Exception e) {
            log.error("Error fetching compliance categories", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /* * * GetMonth度ComplianceTrend */
    @GetMapping("/monthly-trend")
    public ResponseEntity<Map<String, Object>> getMonthlyTrend() {
        try {
            Map<String, Object> monthlyTrend = reportService.getMonthlyTrend();
            return ResponseEntity.ok(monthlyTrend);
        } catch (Exception e) {
            log.error("Error fetching monthly trend", e);
            return ResponseEntity.badRequest().build();
        }
    }
}