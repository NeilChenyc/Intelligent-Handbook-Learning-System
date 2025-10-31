package com.quiz.controller;

import com.quiz.dto.StartQuizRequest;
import com.quiz.dto.SubmitAnswerRequest;
import com.quiz.dto.QuizSubmissionResult;
import com.quiz.entity.QuizAttempt;
import com.quiz.entity.StudentAnswer;
import com.quiz.service.QuizAttemptService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/quiz-attempts")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"}, 
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS},
             allowedHeaders = "*",
             allowCredentials = "true")
public class QuizAttemptController {

    private final QuizAttemptService quizAttemptService;

    /* * * ProcessCORS预检Request */
    @RequestMapping(value = "/* * ", method = RequestMethod.OPTIONS)
    public ResponseEntity<?> handleOptionsRequest() {
        log.info("=== OPTIONS request received ===");
        return ResponseEntity.ok()
                .header("Access-Control-Allow-Origin", "http://localhost:3000")
                .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                .header("Access-Control-Allow-Headers", "*")
                .header("Access-Control-Allow-Credentials", "true")
                .build();
    }

    /* * * StartQuiz尝试 */
    @PostMapping("/start")
    public ResponseEntity<?> startQuizAttempt(@RequestBody StartQuizRequest request) {
        log.info("=== startQuizAttempt method called ===");
        log.info("Request: {}", request);
        
        try {
            if (request == null) {
                log.error("Request is null");
                return ResponseEntity.badRequest().body("Request body is null");
            }
            
            if (request.getUserId() == null || request.getQuizId() == null) {
                log.error("Missing required parameters: userId={}, quizId={}", request.getUserId(), request.getQuizId());
                return ResponseEntity.badRequest().body("Missing required parameters");
            }
            
            log.info("Parsed parameters: userId={}, quizId={}", request.getUserId(), request.getQuizId());
            
            QuizAttempt attempt = quizAttemptService.startQuizAttempt(request.getUserId(), request.getQuizId());
            return ResponseEntity.ok(attempt);
        } catch (Exception e) {
            log.error("Error starting quiz attempt", e);
            return ResponseEntity.status(500).body("Internal server error: " + e.getMessage());
        }
    }

    /* * * SubmitQuizAnswer */
    @PostMapping("/{attemptId}/submit")
    public ResponseEntity<?> submitQuizAttempt(@PathVariable("attemptId") Long attemptId, @RequestBody List<SubmitAnswerRequest> answerRequests) {
        log.info("=== submitQuizAttempt method called ===");
        log.info("AttemptId: {}, AnswerRequests: {}", attemptId, answerRequests);
        
        try {
            if (attemptId == null) {
                log.error("AttemptId is null");
                return ResponseEntity.badRequest()
                    .header("Content-Type", "application/json")
                    .body("{\"error\":\"AttemptId is required\"}");
            }
            
            if (answerRequests == null || answerRequests.isEmpty()) {
                log.error("AnswerRequests is null or empty");
                return ResponseEntity.badRequest()
                    .header("Content-Type", "application/json")
                    .body("{\"error\":\"Answer requests are required\"}");
            }

            // Validate that selectedOptions in each answer request is not null
            for (SubmitAnswerRequest request : answerRequests) {
                if (request.getSelectedOptions() == null) {
                    log.error("SelectedOptions is null for questionId: {}", request.getQuestionId());
                    return ResponseEntity.badRequest()
                        .header("Content-Type", "application/json")
                        .body("{\"error\":\"Selected options cannot be null\"}");
                }
            }
            
            QuizSubmissionResult result = quizAttemptService.submitQuizAttempt(attemptId, answerRequests);
            log.info("Quiz attempt submitted successfully: {}", result.getAttemptId());
            
            // Directly return QuizSubmissionResult object
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error submitting quiz attempt for attemptId: {}", attemptId, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Internal server error: " + e.getMessage());
            errorResponse.put("attemptId", attemptId);
            
            return ResponseEntity.status(500)
                .header("Content-Type", "application/json")
                .body(errorResponse);
        }
    }

    /* * * GetQuiz尝试Details */
    @GetMapping("/{attemptId}")
    public ResponseEntity<?> getQuizAttempt(@PathVariable("attemptId") Long attemptId) {
        try {
            Optional<QuizAttempt> attempt = quizAttemptService.getAttemptById(attemptId);
            if (attempt.isPresent()) {
                return ResponseEntity.ok(attempt.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error getting quiz attempt", e);
            return ResponseEntity.status(500).body("Internal server error: " + e.getMessage());
        }
    }

    /* * * GetUser在某Course中已通过的QuizInfo */
    @GetMapping("/user/{userId}/course/{courseId}/passed")
    public ResponseEntity<List<Long>> getUserPassedQuizzesInCourse(
            @PathVariable("userId") Long userId, 
            @PathVariable("courseId") Long courseId) {
        try {
            List<Long> passedQuizIds = quizAttemptService.getUserPassedQuizzesInCourse(userId, courseId);
            return ResponseEntity.ok(passedQuizIds);
        } catch (Exception e) {
            log.error("Error getting user passed quizzes in course: userId={}, courseId={}", userId, courseId, e);
            return ResponseEntity.badRequest().build();
        }
    }
}