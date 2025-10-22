package com.quiz.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

/**
 * Agent 处理请求 DTO
 * 用于接收前端发起的 AI 自动生成测验请求
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AgentProcessRequest {
    
    /**
     * 课程ID - 必须是已上传PDF的课程
     */
    @NotNull(message = "课程ID不能为空")
    private Long courseId;
    
    /**
     * 处理模式：auto（自动）或 manual（手动确认）
     */
    private String processingMode = "auto";
    
    /**
     * 生成的测验数量，默认5个
     */
    @Min(value = 1, message = "测验数量至少为1")
    @Max(value = 10, message = "测验数量最多为10")
    private Integer quizCount = 5;
    
    /**
     * 每个测验的题目数量，默认5-10题
     */
    @Min(value = 3, message = "每个测验题目数量至少为3")
    @Max(value = 15, message = "每个测验题目数量最多为15")
    private Integer questionsPerQuiz = 8;
    
    /**
     * 难度级别：easy, medium, hard
     */
    private String difficulty = "medium";
    
    /**
     * 是否覆盖已存在的测验（如果课程已有测验）
     */
    private Boolean overwriteExisting = false;
    
    /**
     * 额外的处理指令或要求
     */
    private String additionalInstructions;
}