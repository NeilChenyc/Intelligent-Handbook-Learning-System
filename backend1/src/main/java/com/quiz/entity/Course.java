package com.quiz.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "courses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "teacher_id", nullable = false)
    @JsonIgnoreProperties({"courses", "password"})
    private User teacher;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"course", "questions", "createdAt", "updatedAt"})
    private List<Quiz> quizzes;

    @Column(name = "handbook_file_name")
    private String handbookFileName;

    @Column(name = "handbook_file_path")
    private byte[] handbookFilePath;

    // 添加一个方法来获取Base64编码的内容
    @Transient
    public String getHandbookContent() {
        if (handbookFilePath != null) {
            return java.util.Base64.getEncoder().encodeToString(handbookFilePath);
        }
        return null;
    }

    @Column(name = "handbook_file_size")
    private Long handbookFileSize;

    @Column(name = "handbook_content_type")
    private String handbookContentType;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}