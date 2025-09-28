package com.quiz.service;

import com.quiz.dto.ProgressResponse;

public interface ProgressService {
    
    /**
     * 获取用户学习进度
     */
    ProgressResponse getUserProgress(String token);
    
    /**
     * 获取指定用户的学习进度（管理员功能）
     */
    ProgressResponse getUserProgressById(Long userId, String token);
    
    /**
     * 更新学习时长
     */
    void updateStudyTime(Long courseId, Long timeSpent, String token);
}