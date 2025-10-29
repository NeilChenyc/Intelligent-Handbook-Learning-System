package com.quiz.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotResponse {
    
    /**
     * AI回复消息
     */
    private String message;
    
    /**
     * 请求是否成功处理
     */
    private boolean success;
    
    /**
     * 使用的工具列表
     */
    private List<String> toolsUsed;
    
    /**
     * 工具执行结果（可选，用于调试）
     */
    private Map<String, Object> toolResults;
    
    /**
     * 响应时间戳
     */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
    
    /**
     * 会话ID
     */
    private String sessionId;
    
    /**
     * 建议的后续操作（可选）
     */
    private List<String> suggestedActions;
    
    /**
     * 错误信息（如果有）
     */
    private String errorMessage;
    
    /**
     * 响应类型（text, data, error等）
     */
    @Builder.Default
    private String responseType = "text";
}