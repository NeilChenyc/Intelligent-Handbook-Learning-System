package com.quiz.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quiz.entity.Course;
import com.quiz.entity.Quiz;
import com.quiz.entity.QuizAttempt;
import com.quiz.entity.User;
import com.quiz.repository.CourseRepository;
import com.quiz.repository.QuizAttemptRepository;
import com.quiz.repository.QuizRepository;
import com.quiz.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class CourseAnalyticsControllerTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private QuizRepository quizRepository;

    @Mock
    private QuizAttemptRepository quizAttemptRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CourseAnalyticsController courseAnalyticsController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(courseAnalyticsController).build();
        objectMapper = new ObjectMapper();
    }

    // 测试数据准备
    private Course createTestCourse(Long id, String title, boolean isActive) {
        Course course = new Course();
        course.setId(id);
        course.setTitle(title);
        course.setDescription("Test course description " + id);
        course.setIsActive(isActive);
        course.setCreatedAt(LocalDateTime.now());
        return course;
    }

    private User createTestUser(Long id, String username) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setEmail(username + "@test.com");
        return user;
    }

    private Quiz createTestQuiz(Long id, Course course, boolean isActive) {
        Quiz quiz = new Quiz();
        quiz.setId(id);
        quiz.setTitle("Test Quiz " + id);
        quiz.setCourse(course);
        quiz.setIsActive(isActive);
        return quiz;
    }

    private QuizAttempt createTestQuizAttempt(Long id, Quiz quiz, User user, boolean isPassed, Double percentage) {
        QuizAttempt attempt = new QuizAttempt();
        attempt.setId(id);
        attempt.setQuiz(quiz);
        attempt.setUser(user);
        attempt.setIsPassed(isPassed);
        attempt.setPercentage(percentage);
        attempt.setCreatedAt(LocalDateTime.now());
        return attempt;
    }

    // ============= 测试用例1：课程概览接口 =============
    @Test
    void testGetCoursesOverview_Success() throws Exception {
        // 准备测试数据
        List<Course> activeCourses = Arrays.asList(
                createTestCourse(1L, "Course 1", true),
                createTestCourse(2L, "Course 2", true)
        );
        
        List<Course> recentActiveCourses = Arrays.asList(activeCourses.get(0));
        
        // Mock 行为
        when(courseRepository.countByIsActiveTrue()).thenReturn(2L);
        when(courseRepository.findActiveCoursesWithRecentActivity(any())).thenReturn(recentActiveCourses);
        when(quizRepository.countByIsActiveTrue()).thenReturn(5L);
        when(quizAttemptRepository.count()).thenReturn(100L);
        when(userRepository.count()).thenReturn(50L);

        // 执行测试
        mockMvc.perform(get("/analytics/courses/overview"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.totalCourses").value(2))
                .andExpect(jsonPath("$.activeCourses").value(1))
                .andExpect(jsonPath("$.totalQuizzes").value(5))
                .andExpect(jsonPath("$.totalAttempts").value(100))
                .andExpect(jsonPath("$.totalUsers").value(50))
                .andExpect(jsonPath("$.averagePassRate").isNumber())
                .andExpect(jsonPath("$.lastUpdated").exists());

        // 验证调用
        verify(courseRepository).countByIsActiveTrue();
        verify(courseRepository).findActiveCoursesWithRecentActivity(any(LocalDateTime.class));
        verify(quizRepository).countByIsActiveTrue();
        verify(quizAttemptRepository).count();
        verify(userRepository).count();
    }

    @Test
    void testGetCoursesOverview_EmptyData() throws Exception {
        // Mock 空数据
        when(courseRepository.countByIsActiveTrue()).thenReturn(0L);
        when(courseRepository.findActiveCoursesWithRecentActivity(any())).thenReturn(Collections.emptyList());
        when(quizRepository.countByIsActiveTrue()).thenReturn(0L);
        when(quizAttemptRepository.count()).thenReturn(0L);
        when(userRepository.count()).thenReturn(0L);

        mockMvc.perform(get("/analytics/courses/overview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCourses").value(0))
                .andExpect(jsonPath("$.activeCourses").value(0))
                .andExpect(jsonPath("$.totalQuizzes").value(0))
                .andExpect(jsonPath("$.totalAttempts").value(0))
                .andExpect(jsonPath("$.totalUsers").value(0))
                .andExpect(jsonPath("$.averagePassRate").value(0.0));
    }

    // ============= 测试用例2：单课程详情接口 =============
    @Test
    void testGetCourseDetails_Success() throws Exception {
        // 准备测试数据
        Course course = createTestCourse(1L, "Test Course", true);
        User user1 = createTestUser(1L, "user1");
        User user2 = createTestUser(2L, "user2");
        Quiz quiz = createTestQuiz(1L, course, true);
        
        List<QuizAttempt> attempts = Arrays.asList(
                createTestQuizAttempt(1L, quiz, user1, true, 85.0),
                createTestQuizAttempt(2L, quiz, user2, false, 45.0),
                createTestQuizAttempt(3L, quiz, user1, true, 90.0)
        );

        // Mock 行为
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
        when(quizRepository.countActiveByCourseId(1L)).thenReturn(1L);
        when(quizAttemptRepository.findByCourseId(1L)).thenReturn(attempts);
        when(quizAttemptRepository.findUniqueUsersByCourseId(1L)).thenReturn(2L);
        when(quizAttemptRepository.findUsersWithPassedAttemptsByCourseId(1L)).thenReturn(1L);

        mockMvc.perform(get("/analytics/courses/1/details"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.courseId").value(1))
                .andExpect(jsonPath("$.courseTitle").value("Test Course"))
                .andExpect(jsonPath("$.isActive").value(true))
                .andExpect(jsonPath("$.totalQuizzes").value(1))
                .andExpect(jsonPath("$.totalAttempts").value(3))
                .andExpect(jsonPath("$.averageScore").value(73.33))
                .andExpect(jsonPath("$.passRate").value(66.67))
                .andExpect(jsonPath("$.uniqueUsers").value(2))
                .andExpect(jsonPath("$.totalEnrollments").value(2))
                .andExpect(jsonPath("$.completedEnrollments").value(1));
    }

    @Test
    void testGetCourseDetails_CourseNotFound() throws Exception {
        when(courseRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/analytics/courses/999/details"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void testGetCourseDetails_NoAttempts() throws Exception {
        Course course = createTestCourse(1L, "Test Course", true);
        
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
        when(quizRepository.countActiveByCourseId(1L)).thenReturn(0L);
        when(quizAttemptRepository.findByCourseId(1L)).thenReturn(Collections.emptyList());
        when(quizAttemptRepository.findUniqueUsersByCourseId(1L)).thenReturn(0L);
        when(quizAttemptRepository.findUsersWithPassedAttemptsByCourseId(1L)).thenReturn(0L);

        mockMvc.perform(get("/analytics/courses/1/details"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalQuizzes").value(0))
                .andExpect(jsonPath("$.totalAttempts").value(0))
                .andExpect(jsonPath("$.averageScore").value(0.0))
                .andExpect(jsonPath("$.passRate").value(0.0))
                .andExpect(jsonPath("$.uniqueUsers").value(0));
    }

    // ============= 测试用例3：学习趋势接口 =============
    @Test
    void testGetCourseTrend_Success() throws Exception {
        Course course = createTestCourse(1L, "Test Course", true);
        User user = createTestUser(1L, "user1");
        Quiz quiz = createTestQuiz(1L, course, true);
        
        // 创建过去7天的测试数据
        LocalDateTime now = LocalDateTime.now();
        List<QuizAttempt> attempts = new ArrayList<>();
        
        for (int i = 0; i < 7; i++) {
            LocalDateTime attemptTime = now.minusDays(i);
            attempts.add(createTestQuizAttempt((long) i, quiz, user, i % 2 == 0, 70.0 + i * 5));
        }

        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
        when(quizAttemptRepository.findAttemptsByCourseAndDateRange(eq(1L), any(), any()))
                .thenReturn(attempts);

        mockMvc.perform(get("/analytics/courses/1/trend")
                .param("period", "7"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.courseId").value(1))
                .andExpect(jsonPath("$.courseTitle").value("Test Course"))
                .andExpect(jsonPath("$.periodDays").value(7))
                .andExpect(jsonPath("$.dailyTrend").isArray())
                .andExpect(jsonPath("$.dailyTrend").value(hasSize(8))) // 7天 + 今天
                .andExpect(jsonPath("$.overallAverageScore").isNumber())
                .andExpect(jsonPath("$.totalAttempts").value(7))
                .andExpect(jsonPath("$.passRate").isNumber());
    }

    @Test
    void testGetCourseTrend_DefaultPeriod() throws Exception {
        Course course = createTestCourse(1L, "Test Course", true);
        
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
        when(quizAttemptRepository.findAttemptsByCourseAndDateRange(eq(1L), any(), any()))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/analytics/courses/1/trend"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.periodDays").value(30)); // 默认30天
    }

    // ============= 测试用例4：课程对比接口 =============
    @Test
    void testGetCoursesComparison_Success() throws Exception {
        // 准备测试数据
        Course course1 = createTestCourse(1L, "Course 1", true);
        Course course2 = createTestCourse(2L, "Course 2", true);
        List<Course> courses = Arrays.asList(course1, course2);
        
        User user1 = createTestUser(1L, "user1");
        User user2 = createTestUser(2L, "user2");
        
        Quiz quiz1 = createTestQuiz(1L, course1, true);
        Quiz quiz2 = createTestQuiz(2L, course2, true);
        
        List<QuizAttempt> attempts1 = Arrays.asList(
                createTestQuizAttempt(1L, quiz1, user1, true, 80.0),
                createTestQuizAttempt(2L, quiz1, user2, true, 90.0)
        );
        
        List<QuizAttempt> attempts2 = Arrays.asList(
                createTestQuizAttempt(3L, quiz2, user1, false, 40.0)
        );

        // Mock 行为
        when(courseRepository.findAllById(Arrays.asList(1L, 2L))).thenReturn(courses);
        
        // Course 1 mocks
        when(quizRepository.countActiveByCourseId(1L)).thenReturn(1L);
        when(quizAttemptRepository.findByCourseId(1L)).thenReturn(attempts1);
        when(quizAttemptRepository.findUniqueUsersByCourseId(1L)).thenReturn(2L);
        when(quizAttemptRepository.findUsersWithPassedAttemptsByCourseId(1L)).thenReturn(2L);
        
        // Course 2 mocks
        when(quizRepository.countActiveByCourseId(2L)).thenReturn(1L);
        when(quizAttemptRepository.findByCourseId(2L)).thenReturn(attempts2);
        when(quizAttemptRepository.findUniqueUsersByCourseId(2L)).thenReturn(1L);
        when(quizAttemptRepository.findUsersWithPassedAttemptsByCourseId(2L)).thenReturn(0L);

        mockMvc.perform(get("/analytics/courses/comparison")
                .param("courseIds", "1,2"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.courses").isArray())
                .andExpect(jsonPath("$.courses").value(hasSize(2)))
                .andExpect(jsonPath("$.comparedCoursesCount").value(2))
                .andExpect(jsonPath("$.lastUpdated").exists())
                .andExpect(jsonPath("$.courses[0].courseId").value(1))
                .andExpect(jsonPath("$.courses[0].totalAttempts").value(2))
                .andExpect(jsonPath("$.courses[0].passRate").value(100.0))
                .andExpect(jsonPath("$.courses[1].courseId").value(2))
                .andExpect(jsonPath("$.courses[1].totalAttempts").value(1))
                .andExpect(jsonPath("$.courses[1].passRate").value(0.0));
    }

    @Test
    void testGetCoursesComparison_EmptyCourseIds() throws Exception {
        mockMvc.perform(get("/analytics/courses/comparison")
                .param("courseIds", ""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.courses").isArray())
                .andExpect(jsonPath("$.courses").value(hasSize(0)));
    }

    @Test
    void testGetCoursesComparison_SingleCourse() throws Exception {
        Course course = createTestCourse(1L, "Single Course", true);
        List<Course> courses = Arrays.asList(course);
        
        when(courseRepository.findAllById(Arrays.asList(1L))).thenReturn(courses);
        when(quizRepository.countActiveByCourseId(1L)).thenReturn(0L);
        when(quizAttemptRepository.findByCourseId(1L)).thenReturn(Collections.emptyList());
        when(quizAttemptRepository.findUniqueUsersByCourseId(1L)).thenReturn(0L);
        when(quizAttemptRepository.findUsersWithPassedAttemptsByCourseId(1L)).thenReturn(0L);

        mockMvc.perform(get("/analytics/courses/comparison")
                .param("courseIds", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.courses").value(hasSize(1)))
                .andExpect(jsonPath("$.courses[0].courseId").value(1))
                .andExpect(jsonPath("$.courses[0].courseTitle").value("Single Course"));
    }

    // ============= 测试用例5：错误处理 =============
    @Test
    void testGetCoursesOverview_InternalServerError() throws Exception {
        when(courseRepository.countByIsActiveTrue()).thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/analytics/courses/overview"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void testGetCourseDetails_InternalServerError() throws Exception {
        when(courseRepository.findById(anyLong())).thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/analytics/courses/1/details"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void testGetCourseTrend_InternalServerError() throws Exception {
        when(courseRepository.findById(anyLong())).thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/analytics/courses/1/trend"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void testGetCoursesComparison_InternalServerError() throws Exception {
        when(courseRepository.findAllById(anyList())).thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/analytics/courses/comparison")
                .param("courseIds", "1,2"))
                .andExpect(status().isInternalServerError());
    }
}