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
    
    /* * * UserMessageContent */
    private String message;
    
    /* * * UserID（可选，Used for个性化Reply） */
    private Long userId;
    
    /* * * SessionID（可选，Used forMaintenanceConversationContext） */
    private String sessionId;
    
    /* * * ConversationHistory（可选，Frontend传递的Context） */
    private List<Map<String, Object>> conversationHistory;
    
    /* * * Request的ToolList（可选，指定需要使用的Tool） */
    private List<String> requestedTools;
    
    /* * * 额外的ContextInfo */
    private Map<String, Object> context;
}