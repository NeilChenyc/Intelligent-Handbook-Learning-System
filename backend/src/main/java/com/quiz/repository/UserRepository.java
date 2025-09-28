package com.quiz.repository;

import com.quiz.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    /**
     * 根据用户名查找用户
     */
    Optional<User> findByUsername(String username);
    
    /**
     * 根据邮箱查找用户
     */
    Optional<User> findByEmail(String email);
    
    /**
     * 检查用户名是否存在
     */
    boolean existsByUsername(String username);
    
    /**
     * 检查邮箱是否存在
     */
    boolean existsByEmail(String email);
    
    /**
     * 根据部门查找用户
     */
    List<User> findByDepartment(String department);
    
    /**
     * 根据角色查找用户
     */
    List<User> findByRole(User.Role role);
    
    /**
     * 根据部门和角色查找用户
     */
    List<User> findByDepartmentAndRole(String department, User.Role role);
    
    /**
     * 查找活跃用户
     */
    List<User> findByIsActive(Boolean isActive);
    
    /**
     * 根据用户名模糊查询
     */
    List<User> findByUsernameContainingOrFullNameContaining(String username, String fullName);
}