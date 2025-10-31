package com.quiz.controller;

import com.quiz.dto.AgentProcessRequest;
import com.quiz.dto.AgentProcessResult;
import com.quiz.dto.ProcessingStatus;
import com.quiz.service.PdfQuizAgentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * AI Agent Controller 
 */
@RestController
@RequestMapping("/api/agent")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class AgentController {

    private final PdfQuizAgentService pdfQuizAgentService;

    /* * * 触发AIProcessCoursePDF，自动生成测验
     * @param courseId CourseID
     * @param request ProcessRequestParameter
     * @return ProcessResult */
    @PostMapping("/process-course/{courseId}")
    public ResponseEntity<AgentProcessResult> processCourse(
            @PathVariable("courseId") Long courseId,
            @RequestBody AgentProcessRequest request) {
        try {
            log.info("Received AI processing request for course: {}, request: {}", courseId, request);
            
            // Set course ID
            request.setCourseId(courseId);
            
            // Execute AI processing
            AgentProcessResult result = pdfQuizAgentService.processCourse(request);
            
            log.info("AI processing completed for course: {}, status: {}", courseId, result.getStatus());
            return ResponseEntity.ok(result);
            
        } catch (IllegalArgumentException e) {
            log.error("Invalid request for course {}: {}", courseId, e.getMessage());
            return ResponseEntity.badRequest().body(
                AgentProcessResult.builder()
                    .status("ERROR")
                    .courseId(courseId)
                    .errorMessage("请求参数无效: " + e.getMessage())
                    .build()
            );
        } catch (Exception e) {
            log.error("Error processing course {} with AI: {}", courseId, e.getMessage(), e);
            return ResponseEntity.status(500).body(
                AgentProcessResult.builder()
                    .status("ERROR")
                    .courseId(courseId)
                    .errorMessage("AI处理失败: " + e.getMessage())
                    .build()
            );
        }
    }

    /* * * Asynchronous触发AIProcessCoursePDF
     * @param courseId CourseID
     * @param request ProcessRequestParameter
     * @return TaskID和初始Status */
    @PostMapping("/process-course/{courseId}/async")
    public ResponseEntity<Map<String, Object>> processCourseAsync(
            @PathVariable("courseId") Long courseId,
            @RequestBody AgentProcessRequest request) {
        try {
            log.info("Received async AI processing request for course: {}", courseId);
            
            // Set course ID
            request.setCourseId(courseId);
            
            // Asynchronously execute AI processing, ensure Controller and Service use same taskId
            String taskId = java.util.UUID.randomUUID().toString();
            pdfQuizAgentService.processCourseAsync(request, taskId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "taskId", taskId,
                "message", "AI处理任务已启动",
                "courseId", courseId
            ));
            
        } catch (Exception e) {
            log.error("Error starting async AI processing for course {}: {}", courseId, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "启动AI处理任务失败: " + e.getMessage(),
                "courseId", courseId
            ));
        }
    }

    /* * * GetAIProcessTaskStatus
     * @param taskId TaskID
     * @return ProcessStatus */
    @GetMapping("/status/{taskId}")
    public ResponseEntity<ProcessingStatus> getProcessingStatus(@PathVariable("taskId") String taskId) {
        try {
            log.debug("Getting processing status for task: {}", taskId);
            
            ProcessingStatus status = pdfQuizAgentService.getProcessingStatus(taskId);
            
            if (status == null) {
                log.warn("Task not found: {}", taskId);
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(status);
            
        } catch (Exception e) {
            log.error("Error getting processing status for task {}: {}", taskId, e.getMessage(), e);
            return ResponseEntity.status(500).body(
                ProcessingStatus.builder()
                    .taskId(taskId)
                    .status("ERROR")
                    .message("获取任务状态失败: " + e.getMessage())
                    .build()
            );
        }
    }

    /* * * 健康Check端点
     * @return ServiceStatus */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        try {
            return ResponseEntity.ok(Map.of(
                "status", "OK",
                "service", "AI Agent Service",
                "message", "AI Agent服务运行正常",
                "timestamp", java.time.LocalDateTime.now()
            ));
        } catch (Exception e) {
            log.error("Health check failed: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "status", "ERROR",
                "service", "AI Agent Service",
                "message", "服务异常: " + e.getMessage(),
                "timestamp", java.time.LocalDateTime.now()
            ));
        }
    }

    /**
     * Get AI Agent configuration information
     * @return configuration information
     */
    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getAgentConfig() {
        try {
            return ResponseEntity.ok(Map.of(
                "defaultQuizCount", 5,
                "defaultQuestionsPerQuiz", 5,
                "supportedDifficulties", new String[]{"easy", "medium", "hard"},
                "supportedProcessingModes", new String[]{"auto", "manual"},
                "maxPdfSizeMB", 32,
                "maxProcessingTimeMinutes", 5
            ));
        } catch (Exception e) {
            log.error("Error getting agent config: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "error", "获取配置失败: " + e.getMessage()
            ));
        }
    }
}