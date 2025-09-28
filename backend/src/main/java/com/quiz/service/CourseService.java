package com.quiz.service;

import com.quiz.dto.CourseCreateRequest;
import com.quiz.dto.CourseResponse;
import com.quiz.dto.CourseUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CourseService {
    
    /**
     * 获取所有课程（分页）
     */
    Page<CourseResponse> getAllCourses(Pageable pageable);
    
    /**
     * 根据ID获取课程详情
     */
    CourseResponse getCourseById(Long id);
    
    /**
     * 创建新课程
     */
    CourseResponse createCourse(CourseCreateRequest request);
    
    /**
     * 上传PDF文件并创建课程
     */
    CourseResponse uploadCourse(MultipartFile file, String title, String description, String category);
    
    /**
     * 更新课程信息
     */
    CourseResponse updateCourse(Long id, CourseUpdateRequest request);
    
    /**
     * 删除课程
     */
    void deleteCourse(Long id);
    
    /**
     * 获取课程的所有小测
     */
    List<Object> getCourseQuizzes(Long courseId);
    
    /**
     * 发布课程
     */
    void publishCourse(Long id);
    
    /**
     * 取消发布课程
     */
    void unpublishCourse(Long id);
}