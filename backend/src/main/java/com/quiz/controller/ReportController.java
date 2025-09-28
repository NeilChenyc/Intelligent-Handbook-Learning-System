package com.quiz.controller;

import com.quiz.dto.ApiResponse;
import com.quiz.dto.ReportResponse;
import com.quiz.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReportController {
    
    private final ReportService reportService;
    
    /**
     * 获取组织合规报告
     */
    @GetMapping("/compliance")
    public ResponseEntity<ApiResponse<ReportResponse>> getComplianceReport(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String timePeriod,
            @RequestHeader("Authorization") String token) {
        try {
            ReportResponse report = reportService.getComplianceReport(department, timePeriod, token);
            return ResponseEntity.ok(ApiResponse.success(report));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("获取合规报告失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取部门报告
     */
    @GetMapping("/department/{department}")
    public ResponseEntity<ApiResponse<ReportResponse>> getDepartmentReport(
            @PathVariable String department,
            @RequestParam(required = false) String timePeriod,
            @RequestHeader("Authorization") String token) {
        try {
            ReportResponse report = reportService.getDepartmentReport(department, timePeriod, token);
            return ResponseEntity.ok(ApiResponse.success(report));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("获取部门报告失败: " + e.getMessage()));
        }
    }
    
    /**
     * 导出报告
     */
    @GetMapping("/export")
    public ResponseEntity<ApiResponse<String>> exportReport(
            @RequestParam String reportType,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String timePeriod,
            @RequestHeader("Authorization") String token) {
        try {
            String downloadUrl = reportService.exportReport(reportType, department, timePeriod, token);
            return ResponseEntity.ok(ApiResponse.success("报告导出成功", downloadUrl));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("导出报告失败: " + e.getMessage()));
        }
    }
}