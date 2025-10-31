package com.quiz.controller;

import com.quiz.dto.ChatbotRequest;
import com.quiz.dto.ChatbotResponse;
import com.quiz.service.ChatbotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/chatbot")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class ChatbotController {

    private final ChatbotService chatbotService;

    /* * * Send聊天Message并GetAIReply */
    @PostMapping("/chat")
    public ResponseEntity<ChatbotResponse> sendMessage(@RequestBody ChatbotRequest request) {
        try {
            log.info("Received chatbot message: {}", request.getMessage());
            ChatbotResponse response = chatbotService.processMessage(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error processing chatbot message", e);
            ChatbotResponse errorResponse = ChatbotResponse.builder()
                    .message("抱歉，我遇到了一些问题，请稍后再试。")
                    .success(false)
                    .build();
            return ResponseEntity.ok(errorResponse);
        }
    }

    /* * * Get可用的ToolList */
    @GetMapping("/tools")
    public ResponseEntity<List<String>> getAvailableTools() {
        try {
            List<String> tools = chatbotService.getAvailableTools();
            return ResponseEntity.ok(tools);
        } catch (Exception e) {
            log.error("Error getting available tools", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /* * * GetCourseManualContent（Used forAIContext） */
    @GetMapping("/course/{courseId}/handbook-content")
    public ResponseEntity<Map<String, Object>> getCourseHandbookContent(@PathVariable Long courseId) {
        try {
            Map<String, Object> content = chatbotService.getCourseHandbookContent(courseId);
            return ResponseEntity.ok(content);
        } catch (Exception e) {
            log.error("Error getting course handbook content for course: {}", courseId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /* * * 健康CheckAPI */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "healthy",
                "service", "chatbot",
                "timestamp", String.valueOf(System.currentTimeMillis())
        ));
    }

    /* * * OpenAI 健康Check：Validate后端是否能连通并Return简单回复 */
    @GetMapping("/health/openai")
    public ResponseEntity<Map<String, Object>> openAiHealth() {
        try {
            Map<String, Object> status = chatbotService.pingOpenAI();
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            log.error("OpenAI health check failed", e);
            return ResponseEntity.status(500).body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
            ));
        }
    }
}