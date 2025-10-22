package com.quiz.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrongQuestionDTO {
    private Long wrongQuestionId;
    private Long userId;
    private String userName;
    private QuestionDTO question;
    private Long quizAttemptId;
    private LocalDateTime createdAt;
    private Boolean isRedone;
    private LocalDateTime redoneAt;
    private LocalDateTime updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionDTO {
        private Long id;
        private String text;
        private String type;
        private String explanation;
        private List<OptionDTO> options;
        private QuizDTO quiz;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptionDTO {
        private Long id;
        private String text;
        private Boolean isCorrect;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizDTO {
        private Long id;
        private String title;
        private CourseDTO course;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CourseDTO {
        private Long id;
        private String title;
    }
}