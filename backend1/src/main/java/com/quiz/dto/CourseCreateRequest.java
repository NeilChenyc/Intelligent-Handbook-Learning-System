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
    private String department; // 部门字段，用于课程管理页面的部门课程分发
}