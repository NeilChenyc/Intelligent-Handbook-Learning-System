package com.quiz.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProgressResponse {
    
    private Long userId;
    private String username;
    private String fullName;
    
    // 整体进度
    private Double overallProgress; // 百分比
    private Long totalStudyTime; // 总学习时长（分钟）
    private Integer completedCourses; // 完成的课程数
    private Integer totalCourses; // 总课程数
    private Integer earnedCertificates; // 获得的认证数
    private Double complianceRate; // 合规率
    
    // 课程进度列表
    private List<CourseProgressDto> courseProgresses;
    
    // 学习统计
    private StudyStatsDto studyStats;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CourseProgressDto {
        private Long courseId;
        private String courseName;
        private String category;
        private Double progress; // 百分比
        private Integer completedQuizzes;
        private Integer totalQuizzes;
        private Long studyTime; // 学习时长（分钟）
        private String status; // NOT_STARTED, IN_PROGRESS, COMPLETED
        private String icon;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudyStatsDto {
        private Long totalStudyTime; // 总学习时长（分钟）
        private Integer completedHandbooks; // 完成的手册数
        private Integer earnedCertificates; // 获得的认证数
        private Double averageScore; // 平均分数
        private Integer totalQuizAttempts; // 总答题次数
        private Integer correctAnswers; // 正确答案数
    }
}