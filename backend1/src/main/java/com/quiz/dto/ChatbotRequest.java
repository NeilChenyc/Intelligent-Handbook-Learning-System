package com.quiz.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotRequest {
    
    /**
     * 用户消息内容
     */
    private String message;
    
    /**
     * 用户ID（可选，用于个性化回复）
     */
    private Long userId;
    
    /**
     * 会话ID（可选，用于维护对话上下文）
     */
    private String sessionId;
    
    /**
     * 对话历史（可选，前端传递的上下文）
     */
    private List<Map<String, Object>> conversationHistory;
    
    /**
     * 请求的工具列表（可选，指定需要使用的工具）
     */
    private List<String> requestedTools;
    
    /**
     * 额外的上下文信息
     */
    private Map<String, Object> context;
}