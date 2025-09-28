package com.quiz.controller;

import com.quiz.dto.ApiResponse;
import com.quiz.dto.QuizCreateRequest;
import com.quiz.dto.QuizResponse;
import com.quiz.dto.QuizSubmissionRequest;
import com.quiz.dto.QuizSubmissionResponse;
import com.quiz.service.QuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class QuizController {
    
    private final QuizService quizService;
    
    /**
     * 获取所有小测（分页）
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<QuizResponse>>> getAllQuizzes(Pageable pageable) {
        try {
            Page<QuizResponse> quizzes = quizService.getAllQuizzes(pageable);
            return ResponseEntity.ok(ApiResponse.success(quizzes));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("获取小测列表失败: " + e.getMessage()));
        }
    }
    
    /**
     * 根据ID获取小测详情
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QuizResponse>> getQuizById(@PathVariable Long id) {
        try {
            QuizResponse quiz = quizService.getQuizById(id);
            return ResponseEntity.ok(ApiResponse.success(quiz));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("获取小测详情失败: " + e.getMessage()));
        }
    }
    
    /**
     * 根据课程ID获取小测列表
     */
    @GetMapping("/course/{courseId}")
    public ResponseEntity<ApiResponse<List<QuizResponse>>> getQuizzesByCourse(@PathVariable Long courseId) {
        try {
            List<QuizResponse> quizzes = quizService.getQuizzesByCourse(courseId);
            return ResponseEntity.ok(ApiResponse.success(quizzes));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("获取课程小测失败: " + e.getMessage()));
        }
    }
    
    /**
     * 创建新小测
     */
    @PostMapping
    public ResponseEntity<ApiResponse<QuizResponse>> createQuiz(@Valid @RequestBody QuizCreateRequest request) {
        try {
            QuizResponse quiz = quizService.createQuiz(request);
            return ResponseEntity.ok(ApiResponse.success("小测创建成功", quiz));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("创建小测失败: " + e.getMessage()));
        }
    }
    
    /**
     * 更新小测
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<QuizResponse>> updateQuiz(
            @PathVariable Long id, 
            @Valid @RequestBody QuizCreateRequest request) {
        try {
            QuizResponse quiz = quizService.updateQuiz(id, request);
            return ResponseEntity.ok(ApiResponse.success("小测更新成功", quiz));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("更新小测失败: " + e.getMessage()));
        }
    }
    
    /**
     * 删除小测
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteQuiz(@PathVariable Long id) {
        try {
            quizService.deleteQuiz(id);
            return ResponseEntity.ok(ApiResponse.success("小测删除成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("删除小测失败: " + e.getMessage()));
        }
    }
    
    /**
     * 提交小测答案
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<QuizSubmissionResponse>> submitQuiz(
            @PathVariable Long id,
            @Valid @RequestBody QuizSubmissionRequest request,
            @RequestHeader("Authorization") String token) {
        try {
            QuizSubmissionResponse response = quizService.submitQuiz(id, request, token);
            return ResponseEntity.ok(ApiResponse.success("答题提交成功", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("提交答案失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取用户的错题列表
     */
    @GetMapping("/wrong-questions")
    public ResponseEntity<ApiResponse<List<QuizResponse>>> getWrongQuestions(
            @RequestHeader("Authorization") String token) {
        try {
            List<QuizResponse> wrongQuestions = quizService.getWrongQuestions(token);
            return ResponseEntity.ok(ApiResponse.success(wrongQuestions));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("获取错题列表失败: " + e.getMessage()));
        }
    }
    
    /**
     * 生成小测题目（基于PDF）
     */
    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<List<QuizResponse>>> generateQuizzes(
            @RequestParam Long courseId,
            @RequestParam(defaultValue = "10") Integer count,
            @RequestParam(defaultValue = "MEDIUM") String difficulty) {
        try {
            List<QuizResponse> quizzes = quizService.generateQuizzes(courseId, count, difficulty);
            return ResponseEntity.ok(ApiResponse.success("题目生成成功", quizzes));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("生成题目失败: " + e.getMessage()));
        }
    }
}