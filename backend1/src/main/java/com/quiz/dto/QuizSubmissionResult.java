package com.quiz.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizSubmissionResult {
    private Long attemptId;
    private Integer totalScore;
    private Integer maxPossibleScore;
    private Boolean passed;
    private Integer passingScore;
    private LocalDateTime completedAt;
    private List<QuestionResult> questionResults;
    private List<WrongQuestionInfo> wrongQuestions;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionResult {
        private Long questionId;
        private String questionText;
        private Boolean isCorrect;
        private Integer pointsEarned;
        private Integer maxPoints;
        private List<String> selectedOptions; // User selected option identifiers
        private List<String> correctOptions;   // Correct answer option identifiers
        private String explanation;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WrongQuestionInfo {
        private Long questionId;
        private String questionText;
        private List<String> selectedOptions;
        private List<String> correctOptions;
        private String explanation;
        private Integer pointsLost;
    }
}