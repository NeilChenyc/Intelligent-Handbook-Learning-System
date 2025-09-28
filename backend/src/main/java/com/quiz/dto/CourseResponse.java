package com.quiz.dto;

import com.quiz.entity.Course;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CourseResponse {
    
    private Long id;
    private String title;
    private String description;
    private String category;
    private String pdfFileName;
    private String pdfFilePath;
    private Course.Status status;
    private Integer totalQuizzes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
}