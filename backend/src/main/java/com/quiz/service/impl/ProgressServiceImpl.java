package com.quiz.service.impl;

import com.quiz.dto.ProgressResponse;
import com.quiz.entity.User;
import com.quiz.entity.UserCourseProgress;
import com.quiz.entity.UserQuizAnswer;
import com.quiz.repository.UserRepository;
import com.quiz.repository.UserCourseProgressRepository;
import com.quiz.repository.UserQuizAnswerRepository;
import com.quiz.repository.CourseRepository;
import com.quiz.service.ProgressService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProgressServiceImpl implements ProgressService {
    
    private final UserRepository userRepository;
    private final UserCourseProgressRepository progressRepository;
    private final UserQuizAnswerRepository quizAnswerRepository;
    private final CourseRepository courseRepository;
    
    @Override
    public ProgressResponse getUserProgress(String token) {
        log.info("获取用户学习进度");
        
        // 从token获取用户信息（这里简化处理）
        User user = userRepository.findByUsername("admin")
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        return buildProgressResponse(user);
    }
    
    @Override
    public ProgressResponse getUserProgressById(Long userId, String token) {
        log.info("获取指定用户学习进度: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        return buildProgressResponse(user);
    }
    
    @Override
    @Transactional
    public void updateStudyTime(Long courseId, Long timeSpent, String token) {
        log.info("更新学习时长: 课程ID={}, 时长={}分钟", courseId, timeSpent);
        
        // 从token获取用户信息（这里简化处理）
        User user = userRepository.findByUsername("admin")
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        // 查找或创建课程进度记录
        UserCourseProgress progress = progressRepository.findByUserIdAndCourseId(user.getId(), courseId)
                .orElse(new UserCourseProgress());
        
        if (progress.getId() == null) {
            // 新建进度记录
            progress.setUser(user);
            progress.setCourse(courseRepository.findById(courseId)
                    .orElseThrow(() -> new RuntimeException("课程不存在")));
            progress.setProgressPercentage(0);
            progress.setIsCompleted(false);
            progress.setStudyTimeMinutes(0);
        }
        
        // 更新学习时长
        progress.setStudyTimeMinutes(progress.getStudyTimeMinutes() + timeSpent.intValue());
        
        progressRepository.save(progress);
        
        log.info("学习时长更新成功: 用户={}, 课程={}, 新增时长={}分钟", 
                user.getUsername(), courseId, timeSpent);
    }
    
    /**
     * 构建进度响应对象
     */
    private ProgressResponse buildProgressResponse(User user) {
        ProgressResponse response = new ProgressResponse();
        
        // 基本用户信息
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setFullName(user.getFullName());
        
        // 获取用户的所有课程进度
        List<UserCourseProgress> courseProgresses = progressRepository.findByUserId(user.getId());
        
        // 计算总体统计
        int totalCourses = courseProgresses.size();
        int completedCourses = (int) courseProgresses.stream()
                .filter(UserCourseProgress::getIsCompleted)
                .count();
        
        int totalStudyTimeMinutes = courseProgresses.stream()
                .mapToInt(UserCourseProgress::getStudyTimeMinutes)
                .sum();
        
        double overallProgress = totalCourses > 0 ? 
                (double) completedCourses / totalCourses * 100 : 0.0;
        
        response.setOverallProgress(overallProgress);
        response.setTotalStudyTime((long) totalStudyTimeMinutes);
        response.setCompletedCourses(completedCourses);
        response.setTotalCourses(totalCourses);
        
        // 获取用户的答题统计
        List<UserQuizAnswer> quizAnswers = quizAnswerRepository.findByUserId(user.getId());
        
        int totalQuizzes = quizAnswers.size();
        int correctAnswers = (int) quizAnswers.stream()
                .filter(UserQuizAnswer::getIsCorrect)
                .count();
        
        double averageScore = quizAnswers.stream()
                .mapToInt(UserQuizAnswer::getScore)
                .average()
                .orElse(0.0);
        
        // 计算合规率（假设80分以上为合规）
        double complianceRate = totalQuizzes > 0 ? 
                (double) quizAnswers.stream()
                        .mapToInt(UserQuizAnswer::getScore)
                        .filter(score -> score >= 80)
                        .count() / totalQuizzes * 100 : 0.0;
        
        response.setComplianceRate(complianceRate);
        
        // 构建课程进度列表
        List<ProgressResponse.CourseProgressDto> courseProgressList = courseProgresses.stream()
                .map(this::convertToCourseProgress)
                .collect(Collectors.toList());
        
        response.setCourseProgresses(courseProgressList);
        
        // 构建学习统计
        ProgressResponse.StudyStatsDto studyStats = new ProgressResponse.StudyStatsDto();
        studyStats.setTotalStudyTime((long) totalStudyTimeMinutes);
        studyStats.setCompletedHandbooks(completedCourses);
        studyStats.setEarnedCertificates(0); // 简化处理
        studyStats.setAverageScore(averageScore);
        studyStats.setTotalQuizAttempts(totalQuizzes);
        studyStats.setCorrectAnswers(correctAnswers);
        
        response.setStudyStats(studyStats);
        
        return response;
    }
    
    /**
     * 转换课程进度
     */
    private ProgressResponse.CourseProgressDto convertToCourseProgress(UserCourseProgress progress) {
        ProgressResponse.CourseProgressDto courseProgress = new ProgressResponse.CourseProgressDto();
        courseProgress.setCourseId(progress.getCourse().getId());
        courseProgress.setCourseName(progress.getCourse().getTitle());
        courseProgress.setCategory(progress.getCourse().getCategory());
        courseProgress.setProgress(progress.getProgressPercentage().doubleValue());
        courseProgress.setStudyTime(progress.getStudyTimeMinutes().longValue());
        courseProgress.setStatus(progress.getIsCompleted() ? "COMPLETED" : "IN_PROGRESS");
        courseProgress.setIcon("📚"); // 默认图标
        
        // 获取课程的小测完成情况
        List<UserQuizAnswer> courseQuizAnswers = quizAnswerRepository
                .findByUserId(progress.getUser().getId());
        
        // 过滤出该课程的答题记录（简化处理）
        int totalQuizzes = courseQuizAnswers.size();
        int completedQuizzes = (int) courseQuizAnswers.stream()
                .filter(UserQuizAnswer::getIsCorrect)
                .count();
        
        courseProgress.setTotalQuizzes(totalQuizzes);
        courseProgress.setCompletedQuizzes(completedQuizzes);
        
        return courseProgress;
    }
    

}