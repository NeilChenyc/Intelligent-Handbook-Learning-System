package com.quiz.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CourseCreateRequest {
    private String title;
    private String description;
    private Long teacherId;
    private String department; // Department field for department course distribution in course management page
}