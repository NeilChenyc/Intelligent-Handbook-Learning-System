package com.quiz.dto;

import com.quiz.entity.Quiz;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizResponse {
    
    private Long id;
    private Long courseId;
    private String courseName;
    private String question;
    private String questionType;
    private List<String> options;
    private List<String> correctAnswers;
    private String explanation;
    private String difficulty;
    private Integer points;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // 用于答题时不返回正确答案
    private boolean hideCorrectAnswers = false;
    
    public List<String> getCorrectAnswers() {
        return hideCorrectAnswers ? null : correctAnswers;
    }
}