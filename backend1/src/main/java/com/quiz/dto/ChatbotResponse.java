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
    
    /** * AIReplyMessage */
    private String message;
    
    /* * * Request是否SuccessProcess */
    private boolean success;
    
    /* * * 使用的ToolList */
    private List<String> toolsUsed;
    
    /* * * ToolExecutionResult（可选，Used forDebug） */
    private Map<String, Object> toolResults;
    
    /* * * ResponseTime戳 */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
    
    /* * * SessionID */
    private String sessionId;
    
    /* * * Suggestion的后续操作（可选） */
    private List<String> suggestedActions;
    
    /* * * ErrorInfo（如果有） */
    private String errorMessage;
    
    /* * * ResponseClass型（text, data, error等） */
    @Builder.Default
    private String responseType = "text";
}