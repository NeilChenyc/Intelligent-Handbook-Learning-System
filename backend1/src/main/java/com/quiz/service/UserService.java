package com.quiz.service;

import com.quiz.entity.User;
import com.quiz.entity.Course;
import com.quiz.entity.Quiz;
import com.quiz.entity.QuizAttempt;
import com.quiz.repository.UserRepository;
import com.quiz.repository.CourseRepository;
import com.quiz.repository.QuizRepository;
import com.quiz.repository.QuizAttemptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private static final Set<String> ALLOWED_DEPARTMENTS = Set.of(
            "Engineering",
            "Human Resources",
            "Marketing",
            "Finance",
            "Operations"
    );

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User createUser(User user) {
        // Simple validation
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        // Department validation
        if (user.getDepartment() == null || !ALLOWED_DEPARTMENTS.contains(user.getDepartment())) {
            throw new RuntimeException("Invalid department. Must be one of: " + String.join(", ", ALLOWED_DEPARTMENTS));
        }
        
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        
        return userRepository.save(user);
    }

    public User updateUser(Long id, User userDetails) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setUsername(userDetails.getUsername());
        user.setEmail(userDetails.getEmail());
        user.setFullName(userDetails.getFullName());
        user.setRole(userDetails.getRole());
        
        // Support updating department field with validation
        if (userDetails.getDepartment() != null) {
            if (!ALLOWED_DEPARTMENTS.contains(userDetails.getDepartment())) {
                throw new RuntimeException("Invalid department. Must be one of: " + String.join(", ", ALLOWED_DEPARTMENTS));
            }
            user.setDepartment(userDetails.getDepartment());
        }
        
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found");
        }
        userRepository.deleteById(id);
    }

    public User authenticateUser(String username, String password) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // For MVP, simple password check (in real app, use proper password hashing)
            if (password.equals(user.getPassword())) {
                return user;
            }
        }
        throw new RuntimeException("Invalid credentials");
    }

    public Map<String, Object> getUserLearningProgress(Long userId) {
        try {
            // 验证用户是否存在
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // 获取所有活跃课程
            List<Course> allCourses = courseRepository.findByIsActiveTrue();
            
            // 获取用户的所有测验尝试记录
            List<QuizAttempt> userAttempts = quizAttemptRepository.findAll().stream()
                    .filter(attempt -> attempt.getUser().getId().equals(userId))
                    .collect(Collectors.toList());

            // 计算总体统计数据
            int totalCourses = allCourses.size();
            int completedCourses = 0;
            int inProgressCourses = 0;
            int totalQuizzes = 0;
            int completedQuizzes = 0;
            int totalStudyHours = 0;

            List<Map<String, Object>> courseProgress = new ArrayList<>();

            for (Course course : allCourses) {
                // 获取该课程下的所有活跃测验
                List<Quiz> courseQuizzes = quizRepository.findByCourseIdAndIsActiveTrue(course.getId());
                totalQuizzes += courseQuizzes.size();

                // 获取用户在该课程中通过的测验ID列表
                List<Long> passedQuizIds = userAttempts.stream()
                        .filter(attempt -> attempt.getIsPassed() && 
                                attempt.getQuiz().getCourse().getId().equals(course.getId()))
                        .map(attempt -> attempt.getQuiz().getId())
                        .distinct()
                        .collect(Collectors.toList());

                completedQuizzes += passedQuizIds.size();

                // 计算课程完成百分比
                int courseCompletionPercentage = courseQuizzes.isEmpty() ? 0 : 
                        (int) Math.round((double) passedQuizIds.size() / courseQuizzes.size() * 100);

                // 确定课程状态
                String courseStatus;
                if (courseCompletionPercentage == 100) {
                    courseStatus = "completed";
                    completedCourses++;
                } else if (courseCompletionPercentage > 0) {
                    courseStatus = "in_progress";
                    inProgressCourses++;
                } else {
                    courseStatus = "not_started";
                }

                // 计算学习时间（基于测验尝试的时间）
                int courseStudyHours = userAttempts.stream()
                        .filter(attempt -> attempt.getQuiz().getCourse().getId().equals(course.getId()) && 
                                attempt.getTimeSpentMinutes() != null)
                        .mapToInt(attempt -> attempt.getTimeSpentMinutes())
                        .sum() / 60; // 转换为小时

                totalStudyHours += courseStudyHours;

                // 构建课程进度信息
                Map<String, Object> courseInfo = new HashMap<>();
                courseInfo.put("courseId", course.getId());
                courseInfo.put("courseName", course.getTitle());
                courseInfo.put("description", course.getDescription());
                courseInfo.put("completionPercentage", courseCompletionPercentage);
                courseInfo.put("status", courseStatus);
                courseInfo.put("totalQuizzes", courseQuizzes.size());
                courseInfo.put("completedQuizzes", passedQuizIds.size());
                courseInfo.put("studyHours", courseStudyHours);
                courseInfo.put("passedQuizIds", passedQuizIds);

                courseProgress.add(courseInfo);
            }

            // 计算总体进度百分比
            int overallProgress = totalQuizzes == 0 ? 0 : 
                    (int) Math.round((double) completedQuizzes / totalQuizzes * 100);

            // 计算合规率（假设完成80%以上的课程算合规）
            long compliantCourses = courseProgress.stream()
                    .mapToInt(course -> (Integer) course.get("completionPercentage"))
                    .filter(percentage -> percentage >= 80)
                    .count();
            
            int complianceRate = totalCourses == 0 ? 0 : 
                    (int) Math.round((double) compliantCourses / totalCourses * 100);

            // 构建返回结果
            Map<String, Object> result = new HashMap<>();
            
            // 总体统计
            Map<String, Object> overallStats = new HashMap<>();
            overallStats.put("totalCourses", totalCourses);
            overallStats.put("completedCourses", completedCourses);
            overallStats.put("inProgressCourses", inProgressCourses);
            overallStats.put("totalQuizzes", totalQuizzes);
            overallStats.put("completedQuizzes", completedQuizzes);
            overallStats.put("overallProgress", overallProgress);
            overallStats.put("complianceRate", complianceRate);
            overallStats.put("totalStudyHours", totalStudyHours);

            result.put("userId", userId);
            result.put("userName", user.getFullName());
            result.put("overallStats", overallStats);
            result.put("courseProgress", courseProgress);
            result.put("lastUpdated", LocalDateTime.now());

            return result;

        } catch (Exception e) {
            log.error("Error getting user learning progress for userId: {}", userId, e);
            throw new RuntimeException("Failed to get user learning progress: " + e.getMessage());
        }
    }
}