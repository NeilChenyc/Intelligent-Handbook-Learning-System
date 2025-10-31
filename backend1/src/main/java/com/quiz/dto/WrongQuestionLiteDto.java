package com.quiz.dto;

import com.quiz.entity.Question;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/* * * 错题轻量级投影 DTO，Used for高效ListLoading，避免ScrapeWeight级实体Field */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrongQuestionLiteDto {
    // WrongQuestion basic information
    private Long wrongQuestionId;
    private Long userId;
    private String userName;
    private Long quizAttemptId;
    private LocalDateTime createdAt;
    private Boolean isRedone;
    private LocalDateTime redoneAt;
    private LocalDateTime updatedAt;

    // Question information
    private Long questionId;
    private String questionText;
    private Question.QuestionType questionType;
    private String explanation;

    // Quiz & Course information (only necessary fields)
    private Long quizId;
    private String quizTitle;
    private Long courseId;
    private String courseTitle;
}