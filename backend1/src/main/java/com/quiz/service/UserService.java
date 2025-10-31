package com.quiz.service;

import com.quiz.entity.User;
import com.quiz.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private static final Set<String> ALLOWED_DEPARTMENTS = Set.of(
            "Engineering",
            "Human Resources",
            "Marketing",
            "Finance",
            "Operations"
    );

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User createUser(User user) {
        // Simple validation
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        // Department validation
        if (user.getDepartment() == null || !ALLOWED_DEPARTMENTS.contains(user.getDepartment())) {
            throw new RuntimeException("Invalid department. Must be one of: " + String.join(", ", ALLOWED_DEPARTMENTS));
        }
        
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        
        return userRepository.save(user);
    }

    public User updateUser(Long id, User userDetails) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setUsername(userDetails.getUsername());
        user.setEmail(userDetails.getEmail());
        user.setFullName(userDetails.getFullName());
        user.setRole(userDetails.getRole());
        
        // Support updating department field with validation
        if (userDetails.getDepartment() != null) {
            if (!ALLOWED_DEPARTMENTS.contains(userDetails.getDepartment())) {
                throw new RuntimeException("Invalid department. Must be one of: " + String.join(", ", ALLOWED_DEPARTMENTS));
            }
            user.setDepartment(userDetails.getDepartment());
        }
        
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found");
        }
        userRepository.deleteById(id);
    }

    public User authenticateUser(String username, String password) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // For MVP, simple password check (in real app, use proper password hashing)
            if (password.equals(user.getPassword())) {
                return user;
            }
        }
        throw new RuntimeException("Invalid credentials");
    }
}