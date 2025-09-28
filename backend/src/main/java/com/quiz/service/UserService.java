package com.quiz.service;

import com.quiz.dto.UserCreateRequest;
import com.quiz.dto.UserResponse;
import com.quiz.dto.UserUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UserService {
    
    /**
     * 获取所有用户（分页）
     */
    Page<UserResponse> getAllUsers(Pageable pageable);
    
    /**
     * 根据ID获取用户
     */
    UserResponse getUserById(Long id);
    
    /**
     * 根据用户名获取用户
     */
    UserResponse getUserByUsername(String username);
    
    /**
     * 创建用户
     */
    UserResponse createUser(UserCreateRequest request);
    
    /**
     * 更新用户
     */
    UserResponse updateUser(Long id, UserUpdateRequest request);
    
    /**
     * 删除用户
     */
    void deleteUser(Long id);
    
    /**
     * 根据部门获取用户
     */
    List<UserResponse> getUsersByDepartment(String department);
    
    /**
     * 根据角色获取用户
     */
    List<UserResponse> getUsersByRole(String role);
    
    /**
     * 获取活跃用户
     */
    List<UserResponse> getActiveUsers();
    
    /**
     * 搜索用户
     */
    List<UserResponse> searchUsers(String keyword);
    
    /**
     * 更新用户资料
     */
    UserResponse updateUserProfile(Long id, UserUpdateRequest request);
    
    /**
     * 修改密码
     */
    void changePassword(Long id, String oldPassword, String newPassword);
}