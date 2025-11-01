package com.quiz.controller;

import com.quiz.dto.WrongQuestionDTO;
import com.quiz.entity.WrongQuestion;
import com.quiz.service.WrongQuestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wrong-questions")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class WrongQuestionController {

    private final WrongQuestionService wrongQuestionService;

    /* * * GetUser未Redo的错题List */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<WrongQuestionDTO>> getUserWrongQuestions(@PathVariable("userId") Long userId) {
        try {
            log.info("Getting wrong questions for user: {}", userId);
            List<WrongQuestionDTO> wrongQuestions = wrongQuestionService.getUserWrongQuestions(userId);
            log.info("Found {} wrong questions for user {}", wrongQuestions.size(), userId);
            return ResponseEntity.ok(wrongQuestions);
        } catch (Exception e) {
            log.error("Error getting user wrong questions for user {}", userId, e);
            return ResponseEntity.status(500).body(null);
        }
    }

    /* * * GetUser在特定Course下的错题 */
    @GetMapping("/user/{userId}/course/{courseId}")
    public ResponseEntity<List<WrongQuestionDTO>> getUserWrongQuestionsByCourse(
            @PathVariable("userId") Long userId,
            @PathVariable("courseId") Long courseId) {
        try {
            List<WrongQuestionDTO> wrongQuestions = wrongQuestionService.getUserWrongQuestionsByCourse(userId, courseId);
            return ResponseEntity.ok(wrongQuestions);
        } catch (Exception e) {
            log.error("Error getting user wrong questions by course", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /* * * GetUser在特定Quiz下的错题 */
    @GetMapping("/user/{userId}/quiz/{quizId}")
    public ResponseEntity<List<WrongQuestionDTO>> getUserWrongQuestionsByQuiz(
            @PathVariable("userId") Long userId,
            @PathVariable("quizId") Long quizId) {
        try {
            List<WrongQuestionDTO> wrongQuestions = wrongQuestionService.getUserWrongQuestionsByQuiz(userId, quizId);
            return ResponseEntity.ok(wrongQuestions);
        } catch (Exception e) {
            log.error("Error getting user wrong questions by quiz", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /* * * GetUser未Redo错题QuantityStatistics */
    @GetMapping("/user/{userId}/count")
    public ResponseEntity<Map<String, Long>> getUserWrongQuestionsCount(@PathVariable("userId") Long userId) {
        try {
            Long count = wrongQuestionService.countUserWrongQuestions(userId);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            log.error("Error getting user wrong questions count", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /* * * 错题RedoSubmit */
    @PostMapping("/{wrongQuestionId}/redo")
    public ResponseEntity<Map<String, Object>> redoWrongQuestion(
            @PathVariable("wrongQuestionId") Long wrongQuestionId,
            @RequestBody Map<String, Object> request) {
        try {
            log.info("Processing wrong question redo for ID: {}, request: {}", wrongQuestionId, request);
            
            // Handle type conversion from Integer to Long for JSON parsing
            @SuppressWarnings("unchecked")
            List<Object> rawSelectedOptionIds = (List<Object>) request.get("selectedOptionIds");
            
            if (rawSelectedOptionIds == null || rawSelectedOptionIds.isEmpty()) {
                log.warn("No selected options provided for wrong question {}", wrongQuestionId);
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "请选择答案"
                ));
            }
            
            // Convert Integer/Long objects to Long
            List<Long> selectedOptionIds = rawSelectedOptionIds.stream()
                    .map(obj -> {
                        if (obj instanceof Integer) {
                            return ((Integer) obj).longValue();
                        } else if (obj instanceof Long) {
                            return (Long) obj;
                        } else {
                            throw new IllegalArgumentException("Invalid option ID type: " + obj.getClass());
                        }
                    })
                    .toList();
            
            log.info("Selected option IDs: {}", selectedOptionIds);
            boolean isCorrect = wrongQuestionService.validateAndMarkRedone(wrongQuestionId, selectedOptionIds);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "isCorrect", isCorrect,
                "message", isCorrect ? "答案正确，已从错题列表中移除" : "答案错误，请重新尝试"
            );
            log.info("Wrong question redo result: {}", response);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error processing wrong question redo for ID: {}", wrongQuestionId, e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "处理错题重做时发生错误: " + e.getMessage()
            ));
        }
    }

    /* * * Get错题Details */
    @GetMapping("/{wrongQuestionId}")
    public ResponseEntity<WrongQuestion> getWrongQuestionDetail(@PathVariable("wrongQuestionId") Long wrongQuestionId) {
        try {
            return wrongQuestionService.getWrongQuestionById(wrongQuestionId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error getting wrong question detail", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /* * * 批量Tag错题为已Redo（AdministratorFeature） */
    @PostMapping("/batch-mark-redone")
    public ResponseEntity<Map<String, Object>> batchMarkAsRedone(@RequestBody Map<String, List<Long>> request) {
        try {
            List<Long> wrongQuestionIds = request.get("wrongQuestionIds");
            if (wrongQuestionIds == null || wrongQuestionIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "请提供错题ID列表"
                ));
            }
            
            int updatedCount = 0;
            for (Long wrongQuestionId : wrongQuestionIds) {
                try {
                    wrongQuestionService.markAsRedone(wrongQuestionId);
                    updatedCount++;
                } catch (Exception e) {
                    log.warn("Failed to mark wrong question {} as redone", wrongQuestionId, e);
                }
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "updatedCount", updatedCount,
                "message", String.format("成功标记 %d 道错题为已重做", updatedCount)
            ));
        } catch (Exception e) {
            log.error("Error batch marking wrong questions as redone", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "批量标记错题时发生错误: " + e.getMessage()
            ));
        }
    }

    /* * * 清理已Redo的错题Record（AdministratorFeature） */
    @DeleteMapping("/cleanup-redone")
    public ResponseEntity<Map<String, Object>> cleanupRedoneWrongQuestions() {
        try {
            int deletedCount = wrongQuestionService.cleanupRedoneWrongQuestions();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "deletedCount", deletedCount,
                "message", String.format("成功清理 %d 条已重做的错题记录", deletedCount)
            ));
        } catch (Exception e) {
            log.error("Error cleaning up redone wrong questions", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "清理已重做错题记录时发生错误: " + e.getMessage()
            ));
        }
    }
}