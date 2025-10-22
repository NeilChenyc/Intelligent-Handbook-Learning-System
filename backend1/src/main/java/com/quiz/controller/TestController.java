package com.quiz.controller;

import com.quiz.entity.QuizAttempt;
import com.quiz.entity.User;
import com.quiz.service.QuizAttemptService;
import com.quiz.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/test")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class TestController {

    private final UserService userService;
    private final QuizAttemptService quizAttemptService;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "OK",
            "timestamp", LocalDateTime.now(),
            "message", "Quiz Backend MVP is running successfully"
        ));
    }

    @GetMapping("/database")
    public ResponseEntity<Map<String, Object>> testDatabase() {
        try {
            // Test database connection by counting users
            long userCount = userService.getAllUsers().size();
            
            return ResponseEntity.ok(Map.of(
                "status", "OK",
                "database", "Connected",
                "userCount", userCount,
                "timestamp", LocalDateTime.now()
            ));
        } catch (Exception e) {
            log.error("Database test failed", e);
            return ResponseEntity.ok(Map.of(
                "status", "ERROR",
                "database", "Connection failed",
                "error", e.getMessage(),
                "timestamp", LocalDateTime.now()
            ));
        }
    }

    @GetMapping("/quiz-attempts/{userId}/{quizId}")
    public ResponseEntity<Map<String, Object>> getQuizAttempts(@PathVariable Long userId, @PathVariable Long quizId) {
        try {
            // 直接使用repository查询
            int attemptCount = quizAttemptService.getAttemptsByUserAndQuiz(userId, quizId).size();
            return ResponseEntity.ok(Map.of(
                "userId", userId,
                "quizId", quizId,
                "attemptCount", attemptCount,
                "timestamp", LocalDateTime.now()
            ));
        } catch (Exception e) {
            log.error("Error getting quiz attempts for user {} and quiz {}: {}", userId, quizId, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "error", e.getMessage(),
                "userId", userId,
                "quizId", quizId,
                "timestamp", LocalDateTime.now()
            ));
        }
    }

    @PostMapping("/json-test")
    public ResponseEntity<Map<String, Object>> testJsonRequest(@RequestBody Map<String, Object> request) {
        log.info("JSON test endpoint called with request: {}", request);
        return ResponseEntity.ok(Map.of(
            "received", request,
            "status", "success",
            "timestamp", LocalDateTime.now()
        ));
    }

    @PostMapping("/create-sample-data")
    public ResponseEntity<Map<String, Object>> createSampleData() {
        try {
            // Create sample admin user
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword("admin123");
            admin.setEmail("admin@quiz.com");
            admin.setFullName("System Administrator");
            admin.setRole(User.Role.ADMIN);
            
            User createdAdmin = userService.createUser(admin);
            
            // Create sample teacher
            User teacher = new User();
            teacher.setUsername("teacher");
            teacher.setPassword("teacher123");
            teacher.setEmail("teacher@quiz.com");
            teacher.setFullName("Sample Teacher");
            teacher.setRole(User.Role.TEACHER);
            
            User createdTeacher = userService.createUser(teacher);
            
            // Create sample student
            User student = new User();
            student.setUsername("student");
            student.setPassword("student123");
            student.setEmail("student@quiz.com");
            student.setFullName("Sample Student");
            student.setRole(User.Role.STUDENT);
            
            User createdStudent = userService.createUser(student);
            
            return ResponseEntity.ok(Map.of(
                "status", "OK",
                "message", "Sample data created successfully",
                "users", Map.of(
                    "admin", createdAdmin.getId(),
                    "teacher", createdTeacher.getId(),
                    "student", createdStudent.getId()
                ),
                "timestamp", LocalDateTime.now()
            ));
        } catch (Exception e) {
            log.error("Error creating sample data", e);
            return ResponseEntity.ok(Map.of(
                "status", "ERROR",
                "message", e.getMessage(),
                "timestamp", LocalDateTime.now()
            ));
        }
    }
}