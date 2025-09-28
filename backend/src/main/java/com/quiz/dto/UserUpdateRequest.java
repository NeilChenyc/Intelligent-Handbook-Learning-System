package com.quiz.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateRequest {
    
    @Email(message = "邮箱格式不正确")
    private String email;
    
    @Size(max = 100, message = "全名长度不能超过100个字符")
    private String fullName;
    
    @Size(min = 6, max = 100, message = "密码长度必须在6-100个字符之间")
    private String password;
    
    private String role; // ADMIN, MANAGER, EMPLOYEE
    
    private String department;
    
    private Boolean isActive;
}