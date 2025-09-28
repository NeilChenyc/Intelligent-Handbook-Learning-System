package com.quiz.service.impl;

import com.quiz.dto.UserCreateRequest;
import com.quiz.dto.UserResponse;
import com.quiz.dto.UserUpdateRequest;
import com.quiz.entity.User;
import com.quiz.repository.UserRepository;
import com.quiz.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Override
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        log.info("获取所有用户，页码: {}, 大小: {}", pageable.getPageNumber(), pageable.getPageSize());
        
        Page<User> users = userRepository.findAll(pageable);
        return users.map(this::convertToResponse);
    }
    
    @Override
    public UserResponse getUserById(Long id) {
        log.info("获取用户详情: {}", id);
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        return convertToResponse(user);
    }
    
    @Override
    public UserResponse getUserByUsername(String username) {
        log.info("根据用户名获取用户: {}", username);
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        return convertToResponse(user);
    }
    
    @Override
    @Transactional
    public UserResponse createUser(UserCreateRequest request) {
        log.info("创建用户: {}", request.getUsername());
        
        // 检查用户名是否已存在
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }
        
        // 检查邮箱是否已存在
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("邮箱已存在");
        }
        
        // 创建用户
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(User.Role.valueOf(request.getRole()));
        user.setDepartment(request.getDepartment());
        user.setIsActive(true);
        
        User savedUser = userRepository.save(user);
        log.info("用户创建成功: {}", savedUser.getId());
        
        return convertToResponse(savedUser);
    }
    
    @Override
    @Transactional
    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        log.info("更新用户: {}", id);
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        // 更新用户信息
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("邮箱已存在");
            }
            user.setEmail(request.getEmail());
        }
        
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        
        if (request.getRole() != null) {
            user.setRole(User.Role.valueOf(request.getRole()));
        }
        
        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment());
        }
        
        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }
        
        User updatedUser = userRepository.save(user);
        log.info("用户更新成功: {}", updatedUser.getId());
        
        return convertToResponse(updatedUser);
    }
    
    @Override
    @Transactional
    public void deleteUser(Long id) {
        log.info("删除用户: {}", id);
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        // 软删除：设置为非活跃状态
        user.setIsActive(false);
        userRepository.save(user);
        
        log.info("用户删除成功: {}", id);
    }
    
    @Override
    public List<UserResponse> getUsersByDepartment(String department) {
        log.info("根据部门获取用户: {}", department);
        
        List<User> users = userRepository.findByDepartment(department);
        return users.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<UserResponse> getUsersByRole(String role) {
        log.info("根据角色获取用户: {}", role);
        
        List<User> users = userRepository.findByRole(User.Role.valueOf(role));
        return users.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<UserResponse> getActiveUsers() {
        log.info("获取活跃用户列表");
        
        List<User> users = userRepository.findByIsActive(true);
        return users.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<UserResponse> searchUsers(String keyword) {
        log.info("搜索用户: {}", keyword);
        
        List<User> users = userRepository.findByUsernameContainingOrFullNameContaining(keyword, keyword);
        return users.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public UserResponse updateUserProfile(Long id, UserUpdateRequest request) {
        log.info("更新用户资料: {}", id);
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        // 只允许更新基本信息，不允许更新角色等敏感信息
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("邮箱已存在");
            }
            user.setEmail(request.getEmail());
        }
        
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        
        User updatedUser = userRepository.save(user);
        log.info("用户资料更新成功: {}", updatedUser.getId());
        
        return convertToResponse(updatedUser);
    }
    
    @Override
    @Transactional
    public void changePassword(Long id, String oldPassword, String newPassword) {
        log.info("修改用户密码: {}", id);
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        // 验证旧密码
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("原密码错误");
        }
        
        // 设置新密码
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        log.info("用户密码修改成功: {}", id);
    }
    
    /**
     * 转换User实体为UserResponse DTO
     */
    private UserResponse convertToResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setRole(user.getRole().name());
        response.setDepartment(user.getDepartment());
        response.setIsActive(user.getIsActive());
        response.setCreatedAt(user.getCreatedAt());
        response.setUpdatedAt(user.getUpdatedAt());
        response.setLastLoginAt(user.getLastLogin());
        
        return response;
    }
}