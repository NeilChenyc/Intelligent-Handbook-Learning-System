package com.quiz.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class CourseSummaryDTO {
    private Long id;
    private String title;
    private String description;
    private Boolean isActive;
    private Long teacherId;
    private String teacherFullName;
    private String handbookFileName;
    private Long handbookFileSize;
    private String handbookContentType;
    private String department;
    private LocalDateTime createdAt;
    private Integer quizCount;

    public CourseSummaryDTO(Long id, String title, String description, Boolean isActive,
                            Long teacherId, String teacherFullName,
                            String handbookFileName, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.isActive = isActive;
        this.teacherId = teacherId;
        this.teacherFullName = teacherFullName;
        this.handbookFileName = handbookFileName;
        this.createdAt = createdAt;
        this.quizCount = 0; // 默认值
    }

    // 新增构造函数，包含department字段
    public CourseSummaryDTO(Long id, String title, String description, Boolean isActive,
                            Long teacherId, String teacherFullName,
                            String handbookFileName, String department, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.isActive = isActive;
        this.teacherId = teacherId;
        this.teacherFullName = teacherFullName;
        this.handbookFileName = handbookFileName;
        this.department = department;
        this.createdAt = createdAt;
        this.quizCount = 0; // 默认值
    }
}