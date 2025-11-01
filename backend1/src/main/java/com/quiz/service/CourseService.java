package com.quiz.service;

import com.quiz.dto.CourseCreateRequest;
import com.quiz.dto.CourseSummaryDTO;
import com.quiz.entity.Course;
import com.quiz.entity.User;
import com.quiz.repository.CourseRepository;
import com.quiz.repository.UserRepository;
import com.quiz.repository.WrongQuestionRepository;
import com.quiz.repository.QuizAttemptRepository;
import com.quiz.repository.QuizRepository;
import com.quiz.repository.CertificateRepository;
import com.quiz.repository.UserCertificateRepository;
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
    private final QuizRepository quizRepository;
    private final CertificateRepository certificateRepository;
    private final UserCertificateRepository userCertificateRepository;
    // 新增：引入AI预检Service
    private final PdfQuizAgentService pdfQuizAgentService;
    // 新增：CertificateServiceUsed for在CourseCreate后自动生成Certificate
    private final CertificateService certificateService;

    @Transactional(readOnly = true)
    public List<Course> getAllActiveCourses() {
        try {
            log.info("Fetching all active courses");
            List<Course> courses = courseRepository.findByIsActiveTrue();
            // 手动Settingquizzes为null以避免序Column化Issue，但保留PDFCorrelationField
            courses.forEach(course -> {
                course.setQuizzes(null);
                // 确保PDFCorrelationField被保留
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
        // Validate教师是否存在
        User teacher = userRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        Course course = new Course();
        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setTeacher(teacher);
        course.setDepartment(request.getDepartment()); // Setting部门Field
        course.setIsActive(true);
        course.setCreatedAt(LocalDateTime.now());
        course.setUpdatedAt(LocalDateTime.now());

        Course savedCourse = courseRepository.save(course);
        log.info("Course created with id: {}", savedCourse.getId());

        // 在CourseCreate完成后自动CreateCertificate（使用DefaultTemplate与Parameter）
        try {
            certificateService.createCertificateForCourse(
                savedCourse.getId(),
                null, // 使用CourseTitle作为Certificate名
                null, // Default发Row方
                request.getDescription(), // Certificate描述沿用Course描述
                null, // 等级Default
                null, // 有效期Default
                null  // 通过分数Default
            );
            log.info("Auto-created certificate for course id: {}", savedCourse.getId());
        } catch (Exception e) {
            log.warn("Failed to auto-create certificate for course {}: {}", savedCourse.getId(), e.getMessage());
        }
        return savedCourse;
    }

    public Course createCourseWithPdf(CourseCreateRequest request, org.springframework.web.multipart.MultipartFile handbookFile) throws IOException {
        // Validate教师是否存在
        User teacher = userRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        // ValidatePDFFile
        if (handbookFile == null || handbookFile.isEmpty()) {
            throw new RuntimeException("Handbook PDF file is required");
        }
        
        if (!"application/pdf".equals(handbookFile.getContentType())) {
            throw new RuntimeException("Only PDF files are allowed");
        }

        // 先进RowAI预检，避免PDF先入Library导致不必要的egress
        String preflightPrompt = "课程预检:\n标题:" + request.getTitle() + "\n描述:" + request.getDescription();
        pdfQuizAgentService.preflightCheckPdfWithOpenAI(handbookFile.getBytes(), handbookFile.getOriginalFilename(), preflightPrompt);

        Course course = new Course();
        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setTeacher(teacher);
        course.setDepartment(request.getDepartment()); // Setting部门Field
        
        // SettingPDFFileInformation（通过预检后再入Library）
        course.setHandbookFileName(handbookFile.getOriginalFilename());
        course.setHandbookContentType(handbookFile.getContentType());
        course.setHandbookFileSize(handbookFile.getSize());
        
        // 这里暂时将PDFFileContentStorage为字节Array
        // 在生产Environment中，Suggestion将FileStorage到File系统或云StorageService
        course.setHandbookFilePath(handbookFile.getBytes());
        
        course.setIsActive(true);
        course.setCreatedAt(LocalDateTime.now());
        course.setUpdatedAt(LocalDateTime.now());

        Course savedCourse = courseRepository.save(course);
        log.info("Course created with PDF handbook, id: {}", savedCourse.getId());

        // 如果启用了AI描述生成，则使用AI生成课程描述
        if (Boolean.TRUE.equals(request.getEnableAIDescription())) {
            try {
                log.info("Generating AI course description for course id: {}", savedCourse.getId());
                String aiGeneratedDescription = pdfQuizAgentService.generateCourseDescription(
                    handbookFile.getBytes(), 
                    handbookFile.getOriginalFilename(),
                    request.getTitle()
                );
                
                if (aiGeneratedDescription != null && !aiGeneratedDescription.trim().isEmpty()) {
                    savedCourse.setDescription(aiGeneratedDescription);
                    savedCourse.setUpdatedAt(LocalDateTime.now());
                    savedCourse = courseRepository.save(savedCourse);
                    log.info("AI generated description updated for course id: {}, description length: {}", 
                            savedCourse.getId(), aiGeneratedDescription.length());
                } else {
                    log.warn("AI description generation failed or returned empty for course id: {}", savedCourse.getId());
                }
            } catch (Exception e) {
                log.error("Failed to generate AI description for course id: {}, error: {}", savedCourse.getId(), e.getMessage(), e);
                // 继续执行，不因为AI描述生成失败而中断整个流程
            }
        }

        // 在UploadPDF并CreateCourse后，自动CreateCertificate以便在Available中Display
        try {
            certificateService.createCertificateForCourse(
                savedCourse.getId(),
                null,
                null,
                savedCourse.getDescription(), // 使用可能已更新的描述
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
        existingCourse.setDepartment(request.getDepartment()); // Update部门Field
        
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
        
        // 软Delete
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
        List<CourseSummaryDTO> summaries = courseRepository.findActiveCourseSummaries();
        // 为每个CourseSettingquizQuantity
        for (CourseSummaryDTO summary : summaries) {
            Long quizCount = quizRepository.countActiveByCourseId(summary.getId());
            summary.setQuizCount(quizCount.intValue());
        }
        return summaries;
    }

    public List<CourseSummaryDTO> getCourseSummariesByTeacher(Long teacherId) {
        List<CourseSummaryDTO> summaries = courseRepository.findCourseSummariesByTeacherId(teacherId);
        // 为每个CourseSettingquizQuantity
        for (CourseSummaryDTO summary : summaries) {
            Long quizCount = quizRepository.countActiveByCourseId(summary.getId());
            summary.setQuizCount(quizCount.intValue());
        }
        return summaries;
    }

    public List<CourseSummaryDTO> searchCourseSummaries(String title) {
        List<CourseSummaryDTO> summaries = courseRepository.findCourseSummariesByTitleContainingAndIsActiveTrue(title);
        // 为每个CourseSettingquizQuantity
        for (CourseSummaryDTO summary : summaries) {
            Long quizCount = quizRepository.countActiveByCourseId(summary.getId());
            summary.setQuizCount(quizCount.intValue());
        }
        return summaries;
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

    /* * * 级联硬DeleteCourse及其AssociationData
     * DeleteRange：Course、Correlation测验、测验下Question与Option、错题Record、测验Commit与作答、Certificate */
    @Transactional
    public void deleteCourseCascade(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        log.info("Starting cascade delete for course id {}", id);

        // 1) Delete该Course涉及的错题（AssociationQuestion或测验Commit）
        wrongQuestionRepository.deleteByCourseId(id);
        log.info("Deleted wrong questions for course id {}", id);

        // 2) Delete该Course下的所有测验Commit（将级联Delete学生Answer与OptionAssociation）
        quizAttemptRepository.deleteByCourseId(id);
        log.info("Deleted quiz attempts for course id {}", id);

        // 3) Delete该Course关联的用户证书记录（必须在删除证书之前删除，避免外键约束冲突）
        userCertificateRepository.deleteByCourseId(id);
        log.info("Deleted user certificates for course id {}", id);

        // 4) Delete该CourseAssociation的Certificate（必须在DeleteCourse之前Delete，避免外KeyConstraintConflict）
        certificateRepository.findByCourseId(id).ifPresent(certificate -> {
            certificateRepository.delete(certificate);
            log.info("Deleted certificate for course id {}", id);
        });

        // 5) DeleteCourse实体（级联Delete其下测验、Question和Option）
        courseRepository.delete(course);
        log.info("Cascade deleted course entity and related quizzes/questions/options for id {}", id);
    }
}