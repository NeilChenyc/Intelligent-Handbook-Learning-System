package com.quiz.service;

import com.quiz.dto.CourseCreateRequest;
import com.quiz.entity.Course;
import com.quiz.entity.User;
import com.quiz.repository.CourseRepository;
import com.quiz.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public List<Course> getAllActiveCourses() {
        try {
            log.info("Fetching all active courses");
            List<Course> courses = courseRepository.findAll();
            // 手动设置quizzes为null以避免序列化问题，但保留PDF相关字段
            courses.forEach(course -> {
                course.setQuizzes(null);
                // 确保PDF相关字段被保留
                log.debug("Course {} has handbook: {}", course.getTitle(), course.getHandbookFileName());
            });
            log.info("Found {} courses", courses.size());
            return courses;
        } catch (Exception e) {
            log.error("Error fetching courses", e);
            throw new RuntimeException("Failed to fetch courses", e);
        }
    }

    public Optional<Course> getCourseById(Long id) {
        return courseRepository.findById(id);
    }

    public List<Course> getCoursesByTeacher(Long teacherId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        return courseRepository.findByTeacherAndIsActiveTrue(teacher);
    }

    public List<Course> getActiveCoursesByTeacher(Long teacherId) {
        return courseRepository.findActiveByTeacherId(teacherId);
    }

    public Course createCourse(CourseCreateRequest request) {
        // 验证教师是否存在
        User teacher = userRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        Course course = new Course();
        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setTeacher(teacher);
        course.setIsActive(true);
        course.setCreatedAt(LocalDateTime.now());
        course.setUpdatedAt(LocalDateTime.now());

        Course savedCourse = courseRepository.save(course);
        log.info("Course created with id: {}", savedCourse.getId());
        return savedCourse;
    }

    public Course createCourseWithPdf(CourseCreateRequest request, MultipartFile handbookFile) throws IOException {
        // 验证教师是否存在
        User teacher = userRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        // 验证PDF文件
        if (handbookFile == null || handbookFile.isEmpty()) {
            throw new RuntimeException("Handbook PDF file is required");
        }
        
        if (!"application/pdf".equals(handbookFile.getContentType())) {
            throw new RuntimeException("Only PDF files are allowed");
        }

        Course course = new Course();
        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setTeacher(teacher);
        
        // 设置PDF文件信息
        course.setHandbookFileName(handbookFile.getOriginalFilename());
        course.setHandbookContentType(handbookFile.getContentType());
        course.setHandbookFileSize(handbookFile.getSize());
        
        // 这里暂时将PDF文件内容存储为字节数组
        // 在生产环境中，建议将文件存储到文件系统或云存储服务
        course.setHandbookFilePath(handbookFile.getBytes());
        
        course.setIsActive(true);
        course.setCreatedAt(LocalDateTime.now());
        course.setUpdatedAt(LocalDateTime.now());

        Course savedCourse = courseRepository.save(course);
        log.info("Course created with PDF handbook, id: {}", savedCourse.getId());
        return savedCourse;
    }

    public Course updateCourse(Long id, CourseCreateRequest request) {
        Course existingCourse = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        existingCourse.setTitle(request.getTitle());
        existingCourse.setDescription(request.getDescription());
        
        // 如果需要更换教师
        if (request.getTeacherId() != null && 
            !request.getTeacherId().equals(existingCourse.getTeacher().getId())) {
            User teacher = userRepository.findById(request.getTeacherId())
                    .orElseThrow(() -> new RuntimeException("Teacher not found"));
            existingCourse.setTeacher(teacher);
        }
        
        existingCourse.setUpdatedAt(LocalDateTime.now());

        Course savedCourse = courseRepository.save(existingCourse);
        log.info("Course updated with id: {}", savedCourse.getId());
        return savedCourse;
    }

    public void deleteCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        // 软删除
        course.setIsActive(false);
        course.setUpdatedAt(LocalDateTime.now());
        courseRepository.save(course);
        
        log.info("Course with id {} has been deactivated", id);
    }

    public void activateCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        course.setIsActive(true);
        course.setUpdatedAt(LocalDateTime.now());
        courseRepository.save(course);
        
        log.info("Course with id {} has been activated", id);
    }

    public List<Course> searchCourses(String title) {
        return courseRepository.findByTitleContainingAndIsActiveTrue(title);
    }

    public Long getCourseCountByTeacher(Long teacherId) {
        return courseRepository.countActiveByTeacherId(teacherId);
    }

    public boolean isCourseOwnedByTeacher(Long courseId, Long teacherId) {
        Optional<Course> course = courseRepository.findById(courseId);
        return course.isPresent() && course.get().getTeacher().getId().equals(teacherId);
    }
}