package com.quiz.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

/* * * Agent ProcessRequest DTO
 * Used forReceive前端发起的 AI 自动生成测验Request */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AgentProcessRequest {
    
    /* * * CourseID - 必须是已UploadPDF的Course */
    @NotNull(message = "课程ID不能为空")
    private Long courseId;
    
    /* * * ProcessPattern：auto（自动）或 manual（手动确认） */
    private String processingMode = "auto";
    
    /* * * Generate的QuizQuantity，Default5个 */
    @Min(value = 1, message = "测验数量至少为1")
    @Max(value = 10, message = "测验数量最多为10")
    private Integer quizCount = 5;
    
    /* * * 每个Quiz的QuestionQuantity，Default5-10题 */
    @Min(value = 3, message = "每个测验题目数量至少为3")
    @Max(value = 15, message = "每个测验题目数量最多为15")
    private Integer questionsPerQuiz = 8;
    
    /* * * 难度级别：easy, medium, hard */
    private String difficulty = "medium";
    
    /* * * 是否覆盖已存在的测验（如果Course已有测验） */
    private Boolean overwriteExisting = false;
    
    /* * * 额外的Process指令或Requirement */
    private String additionalInstructions;
    
    /* * * 是否启用Quiz生成 */
    private Boolean enableQuizGeneration = true;
    
    /* * * 是否启用Description生成 */
    private Boolean enableDescriptionGeneration = false;
}