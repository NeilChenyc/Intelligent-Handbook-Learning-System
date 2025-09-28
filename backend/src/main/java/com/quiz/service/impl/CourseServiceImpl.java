package com.quiz.service.impl;

import com.quiz.dto.CourseCreateRequest;
import com.quiz.dto.CourseResponse;
import com.quiz.dto.CourseUpdateRequest;
import com.quiz.entity.Course;
import com.quiz.entity.User;
import com.quiz.repository.CourseRepository;
import com.quiz.repository.UserRepository;
import com.quiz.service.CourseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {
    
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    
    // 文件上传路径
    private static final String UPLOAD_DIR = "uploads/courses/";
    
    @Override
    public Page<CourseResponse> getAllCourses(Pageable pageable) {
        log.info("获取所有课程，页码: {}, 大小: {}", pageable.getPageNumber(), pageable.getPageSize());
        
        Page<Course> courses = courseRepository.findAll(pageable);
        return courses.map(this::convertToResponse);
    }
    
    @Override
    public CourseResponse getCourseById(Long id) {
        log.info("获取课程详情: {}", id);
        
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        return convertToResponse(course);
    }
    
    @Override
    @Transactional
    public CourseResponse createCourse(CourseCreateRequest request) {
        log.info("创建课程: {}", request.getTitle());
        
        // 创建课程
        Course course = new Course();
        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setCategory(request.getCategory());
        course.setStatus(Course.Status.DRAFT);
        
        Course savedCourse = courseRepository.save(course);
        log.info("课程创建成功: {}", savedCourse.getId());
        
        return convertToResponse(savedCourse);
    }
    
    @Override
    @Transactional
    public CourseResponse uploadCourse(MultipartFile file, String title, String description, String category) {
        log.info("上传PDF并创建课程: {}", title);
        
        try {
            // 验证文件
            if (file.isEmpty()) {
                throw new RuntimeException("文件不能为空");
            }
            
            if (!file.getContentType().equals("application/pdf")) {
                throw new RuntimeException("只支持PDF文件");
            }
            
            // 创建上传目录
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            // 生成唯一文件名
            String originalFilename = file.getOriginalFilename();
            String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
            Path filePath = uploadPath.resolve(uniqueFilename);
            
            // 保存文件
            Files.copy(file.getInputStream(), filePath);
            
            // 创建课程
            Course course = new Course();
            course.setTitle(title);
            course.setDescription(description);
            course.setCategory(category);
            course.setFileName(originalFilename);
            course.setFilePath(filePath.toString());
            course.setFileSize(file.getSize());
            course.setStatus(Course.Status.PROCESSING);
            
            Course savedCourse = courseRepository.save(course);
            log.info("PDF课程创建成功: {}", savedCourse.getId());
            
            return convertToResponse(savedCourse);
            
        } catch (IOException e) {
            log.error("文件上传失败: {}", e.getMessage());
            throw new RuntimeException("文件上传失败: " + e.getMessage());
        }
    }
    
    @Override
    @Transactional
    public CourseResponse updateCourse(Long id, CourseUpdateRequest request) {
        log.info("更新课程: {}", id);
        
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        // 更新课程信息
        if (request.getTitle() != null) {
            course.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            course.setDescription(request.getDescription());
        }
        if (request.getCategory() != null) {
            course.setCategory(request.getCategory());
        }
        
        Course updatedCourse = courseRepository.save(course);
        log.info("课程更新成功: {}", updatedCourse.getId());
        
        return convertToResponse(updatedCourse);
    }
    
    @Override
    @Transactional
    public void deleteCourse(Long id) {
        log.info("删除课程: {}", id);
        
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        // 删除相关文件
        if (course.getFilePath() != null) {
            try {
                Path filePath = Paths.get(course.getFilePath());
                Files.deleteIfExists(filePath);
            } catch (IOException e) {
                log.warn("删除课程文件失败: {}", e.getMessage());
            }
        }
        
        courseRepository.delete(course);
        log.info("课程删除成功: {}", id);
    }
    
    @Override
    public List<Object> getCourseQuizzes(Long courseId) {
        log.info("获取课程小测: {}", courseId);
        
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        // 这里应该返回课程相关的小测，暂时返回空列表
        return List.of();
    }
    
    @Override
    @Transactional
    public void publishCourse(Long id) {
        log.info("发布课程: {}", id);
        
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        course.setStatus(Course.Status.PUBLISHED);
        courseRepository.save(course);
        
        log.info("课程发布成功: {}", id);
    }
    
    @Override
    @Transactional
    public void unpublishCourse(Long id) {
        log.info("取消发布课程: {}", id);
        
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        course.setStatus(Course.Status.DRAFT);
        courseRepository.save(course);
        
        log.info("课程取消发布成功: {}", id);
    }
    
    /**
     * 转换Course实体为CourseResponse DTO
     */
    private CourseResponse convertToResponse(Course course) {
        CourseResponse response = new CourseResponse();
        response.setId(course.getId());
        response.setTitle(course.getTitle());
        response.setDescription(course.getDescription());
        response.setCategory(course.getCategory());
        response.setPdfFileName(course.getFileName());
        response.setPdfFilePath(course.getFilePath());
        response.setStatus(course.getStatus());
        response.setTotalQuizzes(course.getQuizCount());
        response.setCreatedAt(course.getCreatedAt());
        response.setUpdatedAt(course.getUpdatedAt());
        
        // 设置创建者信息
        response.setCreatedBy(course.getCreatedBy());
        
        return response;
    }
}