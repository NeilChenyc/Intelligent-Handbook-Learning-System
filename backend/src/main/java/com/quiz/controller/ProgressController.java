package com.quiz.controller;

import com.quiz.dto.ApiResponse;
import com.quiz.dto.ProgressResponse;
import com.quiz.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProgressController {
    
    private final ProgressService progressService;
    
    /**
     * 获取用户学习进度
     */
    @GetMapping
    public ResponseEntity<ApiResponse<ProgressResponse>> getUserProgress(
            @RequestHeader("Authorization") String token) {
        try {
            ProgressResponse progress = progressService.getUserProgress(token);
            return ResponseEntity.ok(ApiResponse.success(progress));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("获取学习进度失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取指定用户的学习进度（管理员功能）
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<ProgressResponse>> getUserProgressById(
            @PathVariable Long userId,
            @RequestHeader("Authorization") String token) {
        try {
            ProgressResponse progress = progressService.getUserProgressById(userId, token);
            return ResponseEntity.ok(ApiResponse.success(progress));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("获取用户进度失败: " + e.getMessage()));
        }
    }
    
    /**
     * 更新学习时长
     */
    @PostMapping("/study-time")
    public ResponseEntity<ApiResponse<String>> updateStudyTime(
            @RequestParam Long courseId,
            @RequestParam Long timeSpent,
            @RequestHeader("Authorization") String token) {
        try {
            progressService.updateStudyTime(courseId, timeSpent, token);
            return ResponseEntity.ok(ApiResponse.success("学习时长更新成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("更新学习时长失败: " + e.getMessage()));
        }
    }
}