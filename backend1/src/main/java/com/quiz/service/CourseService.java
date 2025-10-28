package com.quiz.service;

import com.quiz.dto.CourseCreateRequest;
import com.quiz.dto.CourseSummaryDTO;
import com.quiz.entity.Course;
import com.quiz.entity.User;
import com.quiz.repository.CourseRepository;
import com.quiz.repository.UserRepository;
import com.quiz.repository.WrongQuestionRepository;
import com.quiz.repository.QuizAttemptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
    private final WrongQuestionRepository wrongQuestionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    // 新增：引入AI预检服务
    private final PdfQuizAgentService pdfQuizAgentService;
    // 新增：证书服务用于在课程创建后自动生成证书
    private final CertificateService certificateService;

    @Transactional(readOnly = true)
    public List<Course> getAllActiveCourses() {
        try {
            log.info("Fetching all active courses");
            List<Course> courses = courseRepository.findByIsActiveTrue();
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
        course.setDepartment(request.getDepartment()); // 设置部门字段
        course.setIsActive(true);
        course.setCreatedAt(LocalDateTime.now());
        course.setUpdatedAt(LocalDateTime.now());

        Course savedCourse = courseRepository.save(course);
        log.info("Course created with id: {}", savedCourse.getId());

        // 在课程创建完成后自动创建证书（使用默认模板与参数）
        try {
            certificateService.createCertificateForCourse(
                savedCourse.getId(),
                null, // 使用课程标题作为证书名
                null, // 默认发行方
                request.getDescription(), // 证书描述沿用课程描述
                null, // 技能
                null, // 等级默认
                null, // 有效期默认
                null  // 通过分数默认
            );
            log.info("Auto-created certificate for course id: {}", savedCourse.getId());
        } catch (Exception e) {
            log.warn("Failed to auto-create certificate for course {}: {}", savedCourse.getId(), e.getMessage());
        }
        return savedCourse;
    }

    public Course createCourseWithPdf(CourseCreateRequest request, org.springframework.web.multipart.MultipartFile handbookFile) throws IOException {
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

        // 先进行AI预检，避免PDF先入库导致不必要的egress
        String preflightPrompt = "课程预检:\n标题:" + request.getTitle() + "\n描述:" + request.getDescription();
        pdfQuizAgentService.preflightCheckPdfWithOpenAI(handbookFile.getBytes(), handbookFile.getOriginalFilename(), preflightPrompt);

        Course course = new Course();
        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setTeacher(teacher);
        course.setDepartment(request.getDepartment()); // 设置部门字段
        
        // 设置PDF文件信息（通过预检后再入库）
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

        // 在上传PDF并创建课程后，自动创建证书以便在Available中显示
        try {
            certificateService.createCertificateForCourse(
                savedCourse.getId(),
                null,
                null,
                request.getDescription(),
                null,
                null,
                null,
                null
            );
            log.info("Auto-created certificate for course id: {} after PDF upload", savedCourse.getId());
        } catch (Exception e) {
            log.warn("Failed to auto-create certificate (PDF flow) for course {}: {}", savedCourse.getId(), e.getMessage());
        }
        return savedCourse;
    }

    public Course updateCourse(Long id, CourseCreateRequest request) {
        Course existingCourse = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        existingCourse.setTitle(request.getTitle());
        existingCourse.setDescription(request.getDescription());
        existingCourse.setDepartment(request.getDepartment()); // 更新部门字段
        
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

    public List<CourseSummaryDTO> getCourseSummaries() {
        return courseRepository.findActiveCourseSummaries();
    }

    public List<CourseSummaryDTO> getCourseSummariesByTeacher(Long teacherId) {
        return courseRepository.findCourseSummariesByTeacherId(teacherId);
    }

    public List<CourseSummaryDTO> searchCourseSummaries(String title) {
        return courseRepository.findCourseSummariesByTitleContainingAndIsActiveTrue(title);
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

    /**
     * 级联硬删除课程及其关联数据
     * 删除范围：课程、相关测验、测验下题目与选项、错题记录、测验提交与作答
     */
    @Transactional
    public void deleteCourseCascade(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        log.info("Starting cascade delete for course id {}", id);

        // 1) 删除该课程涉及的错题（关联题目或测验提交）
        wrongQuestionRepository.deleteByCourseId(id);
        log.info("Deleted wrong questions for course id {}", id);

        // 2) 删除该课程下的所有测验提交（将级联删除学生答案与选项关联）
        quizAttemptRepository.deleteByCourseId(id);
        log.info("Deleted quiz attempts for course id {}", id);

        // 3) 删除课程实体（级联删除其下测验、题目和选项）
        courseRepository.delete(course);
        log.info("Cascade deleted course entity and related quizzes/questions/options for id {}", id);
    }
}