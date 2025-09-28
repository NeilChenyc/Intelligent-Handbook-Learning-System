package com.quiz.controller;

import com.quiz.dto.ApiResponse;
import com.quiz.dto.CourseCreateRequest;
import com.quiz.dto.CourseResponse;
import com.quiz.dto.CourseUpdateRequest;
import com.quiz.entity.Course;
import com.quiz.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CourseController {
    
    private final CourseService courseService;
    
    /**
     * 获取所有课程（分页）
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<CourseResponse>>> getAllCourses(Pageable pageable) {
        try {
            Page<CourseResponse> courses = courseService.getAllCourses(pageable);
            return ResponseEntity.ok(ApiResponse.success(courses));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("获取课程列表失败: " + e.getMessage()));
        }
    }
    
    /**
     * 根据ID获取课程详情
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseResponse>> getCourseById(@PathVariable Long id) {
        try {
            CourseResponse course = courseService.getCourseById(id);
            return ResponseEntity.ok(ApiResponse.success(course));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("获取课程详情失败: " + e.getMessage()));
        }
    }
    
    /**
     * 创建新课程
     */
    @PostMapping
    public ResponseEntity<ApiResponse<CourseResponse>> createCourse(@Valid @RequestBody CourseCreateRequest request) {
        try {
            CourseResponse course = courseService.createCourse(request);
            return ResponseEntity.ok(ApiResponse.success("课程创建成功", course));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("创建课程失败: " + e.getMessage()));
        }
    }
    
    /**
     * 上传PDF文件并创建课程
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<CourseResponse>> uploadCourse(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam(value = "category", required = false) String category) {
        try {
            CourseResponse course = courseService.uploadCourse(file, title, description, category);
            return ResponseEntity.ok(ApiResponse.success("课程上传成功", course));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("上传课程失败: " + e.getMessage()));
        }
    }
    
    /**
     * 更新课程信息
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseResponse>> updateCourse(
            @PathVariable Long id, 
            @Valid @RequestBody CourseUpdateRequest request) {
        try {
            CourseResponse course = courseService.updateCourse(id, request);
            return ResponseEntity.ok(ApiResponse.success("课程更新成功", course));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("更新课程失败: " + e.getMessage()));
        }
    }
    
    /**
     * 删除课程
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteCourse(@PathVariable Long id) {
        try {
            courseService.deleteCourse(id);
            return ResponseEntity.ok(ApiResponse.success("课程删除成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("删除课程失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取课程的所有小测
     */
    @GetMapping("/{id}/quizzes")
    public ResponseEntity<ApiResponse<List<Object>>> getCourseQuizzes(@PathVariable Long id) {
        try {
            List<Object> quizzes = courseService.getCourseQuizzes(id);
            return ResponseEntity.ok(ApiResponse.success(quizzes));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("获取课程小测失败: " + e.getMessage()));
        }
    }
    
    /**
     * 发布课程
     */
    @PostMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<String>> publishCourse(@PathVariable Long id) {
        try {
            courseService.publishCourse(id);
            return ResponseEntity.ok(ApiResponse.success("课程发布成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("发布课程失败: " + e.getMessage()));
        }
    }
    
    /**
     * 取消发布课程
     */
    @PostMapping("/{id}/unpublish")
    public ResponseEntity<ApiResponse<String>> unpublishCourse(@PathVariable Long id) {
        try {
            courseService.unpublishCourse(id);
            return ResponseEntity.ok(ApiResponse.success("课程已取消发布"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("取消发布失败: " + e.getMessage()));
        }
    }
}