package com.quiz.controller;

import com.quiz.dto.CreateQuestionRequest;
import com.quiz.dto.QuestionDto;
import com.quiz.entity.Question;
import com.quiz.service.QuestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/questions")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class QuestionController {

    private final QuestionService questionService;

    /* * * 根据quiz IDGet所有活跃Question */
    @GetMapping("/quiz/{quizId}")
    public ResponseEntity<List<QuestionDto>> getQuestionsByQuiz(@PathVariable("quizId") Long quizId) {
        try {
            List<QuestionDto> questions = questionService.getQuestionDtosByQuiz(quizId);
            return ResponseEntity.ok(questions);
        } catch (Exception e) {
            log.error("Error getting questions by quiz id: {}", quizId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /* * * 根据CourseIDGet该Course下所有quiz的Question */
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<Question>> getQuestionsByCourse(@PathVariable("courseId") Long courseId) {
        try {
            List<Question> questions = questionService.getQuestionsByCourse(courseId);
            return ResponseEntity.ok(questions);
        } catch (Exception e) {
            log.error("Error getting questions by course id: {}", courseId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /* * * 根据IDGet单个Question */
    @GetMapping("/{id}")
    public ResponseEntity<Question> getQuestionById(@PathVariable("id") Long id) {
        return questionService.getQuestionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /* * * Create新Question */
    @PostMapping
    public ResponseEntity<Question> createQuestion(@RequestBody CreateQuestionRequest request) {
        try {
            log.info("Received question creation request: {}", request);
            log.info("Quiz ID in request: {}", request.getQuizId());
            log.info("Options in request: {}", request.getOptions());
            log.info("Options count: {}", request.getOptions() != null ? request.getOptions().size() : 0);
            Question createdQuestion = questionService.createQuestion(request);
            return ResponseEntity.ok(createdQuestion);
        } catch (Exception e) {
            log.error("Error creating question: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /* * * UpdateQuestion */
    @PutMapping("/{id}")
    public ResponseEntity<Question> updateQuestion(@PathVariable("id") Long id, @RequestBody Question question) {
        try {
            Question updatedQuestion = questionService.updateQuestion(id, question);
            return ResponseEntity.ok(updatedQuestion);
        } catch (Exception e) {
            log.error("Error updating question with id: {}", id, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /* * * 软DeleteQuestion（Settings为非活跃Status） */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable("id") Long id) {
        try {
            questionService.deleteQuestion(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error deleting question with id: {}", id, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /* * * ActivateQuestion */
    @PutMapping("/{id}/activate")
    public ResponseEntity<Void> activateQuestion(@PathVariable("id") Long id) {
        try {
            questionService.activateQuestion(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error activating question with id: {}", id, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /* * * Get question quantity for quiz */
    @GetMapping("/quiz/{quizId}/count")
    public ResponseEntity<Long> getQuestionCountByQuiz(@PathVariable("quizId") Long quizId) {
        try {
            Long count = questionService.getQuestionCountByQuiz(quizId);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            log.error("Error getting question count for quiz: {}", quizId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /* * * Getquiz下Question总分 */
    @GetMapping("/quiz/{quizId}/total-points")
    public ResponseEntity<Integer> getTotalPointsByQuiz(@PathVariable("quizId") Long quizId) {
        try {
            Integer totalPoints = questionService.getTotalPointsByQuiz(quizId);
            return ResponseEntity.ok(totalPoints != null ? totalPoints : 0);
        } catch (Exception e) {
            log.error("Error getting total points for quiz: {}", quizId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /* * * 批量分配Question到指定quiz */
    @PostMapping("/assign-to-quiz")
    public ResponseEntity<String> assignQuestionsToQuiz(@RequestBody AssignQuestionsRequest request) {
        try {
            questionService.assignQuestionsToQuiz(request.getQuestionIds(), request.getQuizId());
            return ResponseEntity.ok("Questions assigned successfully");
        } catch (Exception e) {
            log.error("Error assigning questions to quiz", e);
            return ResponseEntity.badRequest().body("Failed to assign questions: " + e.getMessage());
        }
    }

    /* * * 批量MoveQuestion到另一个quiz */
    @PutMapping("/move-to-quiz")
    public ResponseEntity<String> moveQuestionsToQuiz(@RequestBody AssignQuestionsRequest request) {
        try {
            questionService.moveQuestionsToQuiz(request.getQuestionIds(), request.getQuizId());
            return ResponseEntity.ok("Questions moved successfully");
        } catch (Exception e) {
            log.error("Error moving questions to quiz", e);
            return ResponseEntity.badRequest().body("Failed to move questions: " + e.getMessage());
        }
    }

    // Inner class for receiving batch assignment requests
    public static class AssignQuestionsRequest {
        private List<Long> questionIds;
        private Long quizId;

        public List<Long> getQuestionIds() {
            return questionIds;
        }

        public void setQuestionIds(List<Long> questionIds) {
            this.questionIds = questionIds;
        }

        public Long getQuizId() {
            return quizId;
        }

        public void setQuizId(Long quizId) {
            this.quizId = quizId;
        }
    }
}