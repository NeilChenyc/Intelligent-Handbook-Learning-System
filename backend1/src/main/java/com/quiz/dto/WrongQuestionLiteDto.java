package com.quiz.dto;

import com.quiz.entity.Question;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 错题轻量级投影 DTO，用于高效列表加载，避免抓取重量级实体字段
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrongQuestionLiteDto {
    // WrongQuestion 基本信息
    private Long wrongQuestionId;
    private Long userId;
    private String userName;
    private Long quizAttemptId;
    private LocalDateTime createdAt;
    private Boolean isRedone;
    private LocalDateTime redoneAt;
    private LocalDateTime updatedAt;

    // Question 信息
    private Long questionId;
    private String questionText;
    private Question.QuestionType questionType;
    private String explanation;

    // Quiz & Course 信息（仅必要字段）
    private Long quizId;
    private String quizTitle;
    private Long courseId;
    private String courseTitle;
}