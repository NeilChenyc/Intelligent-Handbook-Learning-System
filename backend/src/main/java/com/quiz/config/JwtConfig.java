package com.quiz.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "app.jwt")
public class JwtConfig {
    
    /**
     * JWT密钥
     */
    private String secret;
    
    /**
     * JWT过期时间（毫秒）
     */
    private long expiration = 86400000; // 24小时
    
    /**
     * 刷新令牌过期时间（毫秒）
     */
    private long refreshExpiration = 604800000; // 7天
    
    /**
     * JWT发行者
     */
    private String issuer = "learning-platform";
    
    /**
     * JWT受众
     */
    private String audience = "learning-platform-users";
    
    /**
     * 令牌前缀
     */
    private String tokenPrefix = "Bearer ";
    
    /**
     * 头部名称
     */
    private String headerName = "Authorization";
}