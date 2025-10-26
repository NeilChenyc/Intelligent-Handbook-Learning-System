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
    private LocalDateTime createdAt;

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
    }
}