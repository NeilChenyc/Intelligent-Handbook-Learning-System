package com.quiz.service;

import com.quiz.dto.LoginRequest;
import com.quiz.dto.LoginResponse;
import com.quiz.dto.RegisterRequest;

public interface AuthService {
    
    /**
     * 用户登录
     */
    LoginResponse login(LoginRequest request);
    
    /**
     * 用户注册
     */
    void register(RegisterRequest request);
    
    /**
     * 用户登出
     */
    void logout(String token);
    
    /**
     * 验证token
     */
    LoginResponse validateToken(String token);
    
    /**
     * 生成JWT token
     */
    String generateToken(Long userId);
    
    /**
     * 从token中获取用户ID
     */
    Long getUserIdFromToken(String token);
}