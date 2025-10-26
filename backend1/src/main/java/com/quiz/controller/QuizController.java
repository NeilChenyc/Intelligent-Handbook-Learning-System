package com.quiz.controller;

import com.quiz.agent.PdfQuizAgent;
import com.quiz.dto.QuizCreateRequest;
import com.quiz.dto.QuizResponseDto;
import com.quiz.dto.QuizSummaryDto;
import com.quiz.entity.Course;
import com.quiz.entity.Quiz;
import com.quiz.service.CourseService;
import com.quiz.service.QuizService;
import com.quiz.service.QuizAttemptService;
import com.quiz.service.CourseQuizListCacheService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.HashMap;

@RestController
@RequestMapping("/quizzes")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class QuizController {

    private final QuizService quizService;
    private final CourseService courseService;
    private final PdfQuizAgent pdfQuizAgent;
    private final QuizAttemptService quizAttemptService;
    private final CourseQuizListCacheService courseQuizListCacheService;

    @GetMapping
    public ResponseEntity<List<QuizResponseDto>> getAllQuizzes() {
        List<Quiz> quizzes = quizService.getAllActiveQuizzes();
        List<QuizResponseDto> response = quizzes.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Quiz> getQuizById(@PathVariable("id") Long id) {
        return quizService.getQuizById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<QuizResponseDto>> getQuizzesByCourse(@PathVariable("courseId") Long courseId) {
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

    /**
     * 获取课程下的小测摘要信息（优化版本，不包含题目详情）
     */
    @GetMapping("/course/{courseId}/summaries")
    public ResponseEntity<List<QuizSummaryDto>> getQuizSummariesByCourse(@PathVariable("courseId") Long courseId) {
        try {
            log.debug("Getting quiz summaries for course ID: {}", courseId);
            List<QuizSummaryDto> summaries = quizService.getQuizSummaryDtosByCourse(courseId);
            Map<Long, Integer> questionCounts = quizService.getQuizQuestionCounts(courseId);
            log.debug("Found {} quiz summaries for course ID: {}", summaries.size(), courseId);
            
            List<QuizSummaryDto> quizSummaries = summaries.stream()
                    .peek(dto -> dto.setQuestionCount(questionCounts.getOrDefault(dto.getId(), 0)))
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(quizSummaries);
        } catch (Exception e) {
            log.error("Error getting quiz summaries for course ID: {}", courseId, e);
            throw e;
        }
    }

    /**
     * 获取课程下的小测列表（带用户通过信息），并使用 Supabase Postgres 做简易缓存。
     */
    @GetMapping("/course/{courseId}/list-cached")
    public ResponseEntity<Map<String, Object>> getCourseQuizListCached(@PathVariable("courseId") Long courseId,
                                                                       @RequestParam("userId") Long userId) {
        try {
            log.info("list-cached request courseId={}, userId={}", courseId, userId);
            // 命中缓存则直接返回
            java.util.Optional<String> cachedOpt = courseQuizListCacheService.getCache(courseId, userId);
            if (cachedOpt.isPresent()) {
                String payload = cachedOpt.get();
                log.info("Cache HIT courseId={}, userId={}, payloadSize={}", courseId, userId, payload != null ? payload.length() : 0);
                ObjectMapper mapper = new ObjectMapper();
                Map<String, Object> result;
                try {
                    result = mapper.readValue(payload, Map.class);
                } catch (com.fasterxml.jackson.core.JsonProcessingException ex) {
                    log.warn("Failed to parse cached JSON for courseId={}, userId={}", courseId, userId, ex);
                    result = new java.util.HashMap<>();
                    result.put("quizzes", java.util.Collections.emptyList());
                    result.put("passedQuizIds", java.util.Collections.emptyList());
                }
                return ResponseEntity.ok(result);
            }

            log.info("Cache MISS courseId={}, userId={}", courseId, userId);
            // 未命中缓存：查询摘要与用户通过列表（使用投影查询，避免加载 Course 大字段）
            List<QuizSummaryDto> quizSummaries = quizService.getQuizSummaryDtosByCourse(courseId);
            Map<Long, Integer> questionCounts = quizService.getQuizQuestionCounts(courseId);
            quizSummaries.forEach(dto -> dto.setQuestionCount(questionCounts.getOrDefault(dto.getId(), 0)));

            List<Long> passedQuizIds = quizAttemptService.getUserPassedQuizzesInCourse(userId, courseId);

            Map<String, Object> result = new HashMap<>();
            result.put("quizzes", quizSummaries);
            result.put("passedQuizIds", passedQuizIds);

            log.info("Built fresh result: quizzes={}, passedIds={}", quizSummaries.size(), passedQuizIds.size());

            // 写入缓存
            ObjectMapper mapper = new ObjectMapper();
            String payloadJson;
            try {
                payloadJson = mapper.writeValueAsString(result);
            } catch (com.fasterxml.jackson.core.JsonProcessingException ex) {
                log.warn("Failed to serialize result JSON for courseId={}, userId={}", courseId, userId, ex);
                payloadJson = "{\"quizzes\":[],\"passedQuizIds\":[]}";
            }
            courseQuizListCacheService.putCache(courseId, userId, payloadJson);
            log.info("Cache PUT done courseId={}, userId={}, payloadSize={}", courseId, userId, payloadJson.length());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("list-cached failed courseId={}, userId={}", courseId, userId, e);
            Map<String, Object> fallback = new java.util.HashMap<>();
            fallback.put("quizzes", java.util.Collections.emptyList());
            fallback.put("passedQuizIds", java.util.Collections.emptyList());
            return ResponseEntity.ok(fallback);
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

    /**
     * 转换为小测摘要DTO
     */
    private QuizSummaryDto convertToSummaryDto(Quiz quiz, Integer questionCount) {
        QuizSummaryDto dto = new QuizSummaryDto();
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
        
        // 设置课程信息
        if (quiz.getCourse() != null) {
            dto.setCourseId(quiz.getCourse().getId());
            dto.setCourseTitle(quiz.getCourse().getTitle());
        }
        
        // 设置题目数量（从参数获取，避免加载题目）
        dto.setQuestionCount(questionCount);
        
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
    public ResponseEntity<Quiz> updateQuiz(@PathVariable("id") Long id, @RequestBody QuizCreateRequest request) {
        try {
            Quiz quiz = quizService.updateQuiz(id, request);
            return ResponseEntity.ok(quiz);
        } catch (Exception e) {
            log.error("Error updating quiz", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable("id") Long id) {
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