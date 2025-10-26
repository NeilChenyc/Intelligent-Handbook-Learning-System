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

    /**
     * 根据quiz ID获取所有活跃题目
     */
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

    /**
     * 根据课程ID获取该课程下所有quiz的题目
     */
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

    /**
     * 根据ID获取单个题目
     */
    @GetMapping("/{id}")
    public ResponseEntity<Question> getQuestionById(@PathVariable("id") Long id) {
        return questionService.getQuestionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 创建新题目
     */
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

    /**
     * 更新题目
     */
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

    /**
     * 软删除题目（设置为非活跃状态）
     */
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

    /**
     * 激活题目
     */
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

    /**
     * 获取quiz下题目数量
     */
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

    /**
     * 获取quiz下题目总分
     */
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

    /**
     * 批量分配题目到指定quiz
     */
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

    /**
     * 批量移动题目到另一个quiz
     */
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

    // 内部类用于接收批量分配请求
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