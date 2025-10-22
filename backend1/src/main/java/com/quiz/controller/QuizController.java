package com.quiz.controller;

import com.quiz.agent.PdfQuizAgent;
import com.quiz.dto.QuizCreateRequest;
import com.quiz.dto.QuizResponseDto;
import com.quiz.entity.Course;
import com.quiz.entity.Quiz;
import com.quiz.service.CourseService;
import com.quiz.service.QuizService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/quizzes")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class QuizController {

    private final QuizService quizService;
    private final CourseService courseService;
    private final PdfQuizAgent pdfQuizAgent;

    @GetMapping
    public ResponseEntity<List<QuizResponseDto>> getAllQuizzes() {
        List<Quiz> quizzes = quizService.getAllActiveQuizzes();
        List<QuizResponseDto> response = quizzes.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Quiz> getQuizById(@PathVariable Long id) {
        return quizService.getQuizById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<QuizResponseDto>> getQuizzesByCourse(@PathVariable Long courseId) {
        try {
            log.debug("Getting quizzes for course ID: {}", courseId);
            List<Quiz> quizzes = quizService.getQuizzesByCourse(courseId);
            log.debug("Found {} quizzes for course ID: {}", quizzes.size(), courseId);
            
            // 转换为DTO避免循环引用
            List<QuizResponseDto> quizDtos = quizzes.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(quizDtos);
        } catch (Exception e) {
            log.error("Error getting quizzes for course ID: {}", courseId, e);
            throw e;
        }
    }

    private QuizResponseDto convertToDto(Quiz quiz) {
        QuizResponseDto dto = new QuizResponseDto();
        dto.setId(quiz.getId());
        dto.setTitle(quiz.getTitle());
        dto.setDescription(quiz.getDescription());
        dto.setTimeLimitMinutes(quiz.getTimeLimitMinutes());
        dto.setTotalPoints(quiz.getTotalPoints());
        dto.setPassingScore(quiz.getPassingScore());
        dto.setMaxAttempts(quiz.getMaxAttempts());
        dto.setIsActive(quiz.getIsActive());
        dto.setCreatedAt(quiz.getCreatedAt());
        dto.setUpdatedAt(quiz.getUpdatedAt());
        
        if (quiz.getCourse() != null) {
            dto.setCourseId(quiz.getCourse().getId());
            dto.setCourseTitle(quiz.getCourse().getTitle());
        }
        
        if (quiz.getQuestions() != null) {
            dto.setQuestionCount(quiz.getQuestions().size());
        } else {
            dto.setQuestionCount(0);
        }
        
        return dto;
    }

    @PostMapping
    public ResponseEntity<Quiz> createQuiz(@RequestBody QuizCreateRequest request) {
        try {
            Quiz quiz = quizService.createQuiz(request);
            return ResponseEntity.ok(quiz);
        } catch (Exception e) {
            log.error("Error creating quiz", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Quiz> updateQuiz(@PathVariable Long id, @RequestBody QuizCreateRequest request) {
        try {
            Quiz quiz = quizService.updateQuiz(id, request);
            return ResponseEntity.ok(quiz);
        } catch (Exception e) {
            log.error("Error updating quiz", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable Long id) {
        try {
            quizService.deleteQuiz(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error deleting quiz", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/generate-from-pdf")
    public ResponseEntity<Map<String, Object>> generateQuizzesFromPdf(
            @RequestParam("file") MultipartFile file,
            @RequestParam("courseId") Long courseId,
            @RequestParam(value = "difficulty", defaultValue = "medium") String difficulty,
            @RequestParam(value = "numberOfQuestions", defaultValue = "5") int numberOfQuestions) {
        
        try {
            Course course = courseService.getCourseById(courseId)
                    .orElseThrow(() -> new RuntimeException("Course not found"));
            
            List<Quiz> generatedQuizzes = pdfQuizAgent.generateQuizzesFromPdf(file, course, difficulty, numberOfQuestions);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Quizzes generated successfully",
                "quizzes", generatedQuizzes,
                "count", generatedQuizzes.size()
            ));
        } catch (Exception e) {
            log.error("Error generating quizzes from PDF", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/analyze-content")
    public ResponseEntity<Map<String, Object>> analyzeContent(@RequestParam("file") MultipartFile file) {
        try {
            String analysis = pdfQuizAgent.analyzeUploadedContent(file);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "analysis", analysis
            ));
        } catch (Exception e) {
            log.error("Error analyzing content", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}