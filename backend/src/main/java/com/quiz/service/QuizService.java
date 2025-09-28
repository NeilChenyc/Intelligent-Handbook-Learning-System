package com.quiz.service;

import com.quiz.dto.QuizCreateRequest;
import com.quiz.dto.QuizResponse;
import com.quiz.dto.QuizSubmissionRequest;
import com.quiz.dto.QuizSubmissionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface QuizService {
    
    /**
     * 获取所有小测（分页）
     */
    Page<QuizResponse> getAllQuizzes(Pageable pageable);
    
    /**
     * 根据ID获取小测详情
     */
    QuizResponse getQuizById(Long id);
    
    /**
     * 根据课程ID获取小测列表
     */
    List<QuizResponse> getQuizzesByCourse(Long courseId);
    
    /**
     * 创建新小测
     */
    QuizResponse createQuiz(QuizCreateRequest request);
    
    /**
     * 更新小测
     */
    QuizResponse updateQuiz(Long id, QuizCreateRequest request);
    
    /**
     * 删除小测
     */
    void deleteQuiz(Long id);
    
    /**
     * 提交小测答案
     */
    QuizSubmissionResponse submitQuiz(Long quizId, QuizSubmissionRequest request, String token);
    
    /**
     * 获取用户的错题列表
     */
    List<QuizResponse> getWrongQuestions(String token);
    
    /**
     * 生成小测题目（基于PDF）
     */
    List<QuizResponse> generateQuizzes(Long courseId, Integer count, String difficulty);
}