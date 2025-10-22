package com.quiz.config;

import com.quiz.entity.Course;
import com.quiz.entity.Question;
import com.quiz.entity.QuestionOption;
import com.quiz.entity.Quiz;
import com.quiz.repository.CourseRepository;
import com.quiz.repository.QuestionRepository;
import com.quiz.repository.QuestionOptionRepository;
import com.quiz.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Profile;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(name = "app.data-init.enabled", havingValue = "true", matchIfMissing = false)
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CourseRepository courseRepository;
    private final QuestionRepository questionRepository;
    private final QuizRepository quizRepository;
    private final QuestionOptionRepository questionOptionRepository;

    @Override
    public void run(String... args) throws Exception {
        log.info("开始初始化测试数据...");
        
        try {
            // 获取第一个课程用于测试
            List<Course> courses = courseRepository.findAll();
            if (courses.isEmpty()) {
                log.warn("没有找到课程，无法初始化题目数据");
                return;
            }

            Course testCourse = courses.get(0);
            log.info("为课程 '{}' 检查和初始化测试数据", testCourse.getTitle());

            // 检查是否已有Quiz数据
            List<Quiz> existingQuizzes = quizRepository.findByCourseIdAndIsActiveTrue(testCourse.getId());
            if (existingQuizzes.isEmpty()) {
                log.info("没有找到Quiz数据，创建测试Quiz");
                // 创建一个测试Quiz
                Quiz testQuiz = createTestQuiz(testCourse);
                
                // 创建测试题目
                createSampleQuestions(testQuiz);
                
                log.info("测试数据初始化完成");
            } else {
                log.info("找到 {} 个Quiz，检查题目数据", existingQuizzes.size());
                
                // 检查是否有题目数据
                if (questionRepository.count() == 0) {
                    log.info("没有找到题目数据，为现有Quiz创建测试题目");
                    createSampleQuestions(existingQuizzes.get(0));
                    log.info("测试题目数据初始化完成");
                } else {
                    log.info("数据库中已有完整的测试数据，跳过初始化");
                }
            }
        } catch (Exception e) {
            log.error("数据初始化失败: {}", e.getMessage(), e);
            // 不抛出异常，让应用继续启动
        }
    }

    private Quiz createTestQuiz(Course course) {
        Quiz quiz = new Quiz();
        quiz.setTitle("测试小测验");
        quiz.setDescription("用于测试题目管理功能的小测验");
        quiz.setCourse(course);
        quiz.setTimeLimitMinutes(30);
        quiz.setTotalPoints(31);
        quiz.setPassingScore(60);
        quiz.setMaxAttempts(3);
        quiz.setIsActive(true);
        quiz.setCreatedAt(LocalDateTime.now());
        quiz.setUpdatedAt(LocalDateTime.now());
        
        return quizRepository.save(quiz);
    }

    private void createSampleQuestions(Quiz quiz) {
        // 单选题1
        Question singleChoice1 = new Question();
        singleChoice1.setQuestionText("以下哪项是Java的特点？");
        singleChoice1.setType(Question.QuestionType.SINGLE_CHOICE);
        singleChoice1.setPoints(5);
        singleChoice1.setQuiz(quiz);
        singleChoice1.setOrderIndex(1);
        singleChoice1.setExplanation("Java具有面向对象、平台无关、安全性等多个特点。");
        singleChoice1.setIsActive(true);
        singleChoice1.setCreatedAt(LocalDateTime.now());
        singleChoice1.setUpdatedAt(LocalDateTime.now());
        
        Question savedQuestion1 = questionRepository.save(singleChoice1);
        
        // 为单选题1创建选项
        createQuestionOptions(savedQuestion1, 
            new String[]{"面向对象", "平台无关", "安全性", "以上都是"}, 
            new boolean[]{false, false, false, true});

        // 单选题2
        Question singleChoice2 = new Question();
        singleChoice2.setQuestionText("Spring框架的核心特性是什么？");
        singleChoice2.setType(Question.QuestionType.SINGLE_CHOICE);
        singleChoice2.setPoints(5);
        singleChoice2.setQuiz(quiz);
        singleChoice2.setOrderIndex(2);
        singleChoice2.setExplanation("Spring框架的核心特性包括依赖注入(DI)、面向切面编程(AOP)和事务管理等。");
        singleChoice2.setIsActive(true);
        singleChoice2.setCreatedAt(LocalDateTime.now());
        singleChoice2.setUpdatedAt(LocalDateTime.now());
        
        Question savedQuestion2 = questionRepository.save(singleChoice2);
        
        // 为单选题2创建选项
        createQuestionOptions(savedQuestion2, 
            new String[]{"依赖注入", "面向切面编程", "事务管理", "以上都是"}, 
            new boolean[]{false, false, false, true});

        // 多选题
        Question multipleChoice1 = new Question();
        multipleChoice1.setQuestionText("以下哪些是关系型数据库？");
        multipleChoice1.setType(Question.QuestionType.MULTIPLE_CHOICE);
        multipleChoice1.setPoints(8);
        multipleChoice1.setQuiz(quiz);
        multipleChoice1.setOrderIndex(3);
        multipleChoice1.setExplanation("MySQL、PostgreSQL和Oracle都是关系型数据库，而MongoDB是文档型数据库。");
        multipleChoice1.setIsActive(true);
        multipleChoice1.setCreatedAt(LocalDateTime.now());
        multipleChoice1.setUpdatedAt(LocalDateTime.now());
        
        Question savedQuestion3 = questionRepository.save(multipleChoice1);
        
        // 为多选题创建选项
        createQuestionOptions(savedQuestion3, 
            new String[]{"MySQL", "PostgreSQL", "MongoDB", "Oracle"}, 
            new boolean[]{true, true, false, true});

        // 单选题3（判断题形式）
        Question trueFalse1 = new Question();
        trueFalse1.setQuestionText("Java是一种编译型语言。");
        trueFalse1.setType(Question.QuestionType.SINGLE_CHOICE);
        trueFalse1.setPoints(3);
        trueFalse1.setQuiz(quiz);
        trueFalse1.setOrderIndex(4);
        trueFalse1.setExplanation("Java是一种既编译又解释的语言，源代码先编译成字节码，然后由JVM解释执行。");
        trueFalse1.setIsActive(true);
        trueFalse1.setCreatedAt(LocalDateTime.now());
        trueFalse1.setUpdatedAt(LocalDateTime.now());
        
        Question savedQuestion4 = questionRepository.save(trueFalse1);
        
        // 为判断题创建选项
        createQuestionOptions(savedQuestion4, 
            new String[]{"正确", "错误"}, 
            new boolean[]{false, true});

        // 单选题4（开放性问题）
        Question essay1 = new Question();
        essay1.setQuestionText("请简述MVC设计模式的优点。");
        essay1.setType(Question.QuestionType.SINGLE_CHOICE);
        essay1.setPoints(10);
        essay1.setQuiz(quiz);
        essay1.setOrderIndex(5);
        essay1.setExplanation("这是一道开放性题目，主要考查对MVC设计模式理解的深度。");
        essay1.setIsActive(true);
        essay1.setCreatedAt(LocalDateTime.now());
        essay1.setUpdatedAt(LocalDateTime.now());
        
        Question savedQuestion5 = questionRepository.save(essay1);
        
        // 为开放性问题创建选项（可以是多个参考答案）
        createQuestionOptions(savedQuestion5, 
            new String[]{"分离关注点，提高可维护性", "支持多视图，便于界面多样化", "便于团队开发", "提高代码可重用性和可测试性"}, 
            new boolean[]{true, true, true, true});

        log.info("成功为课程 '{}' 的Quiz '{}' 添加了 5 道测试题目", quiz.getCourse().getTitle(), quiz.getTitle());
    }

    private void createQuestionOptions(Question question, String[] optionTexts, boolean[] correctFlags) {
        List<QuestionOption> options = new ArrayList<>();
        
        for (int i = 0; i < optionTexts.length; i++) {
            QuestionOption option = new QuestionOption();
            option.setQuestion(question);
            option.setOptionText(optionTexts[i]);
            option.setIsCorrect(correctFlags[i]);
            option.setOrderIndex(i + 1);
            option.setCreatedAt(LocalDateTime.now());
            option.setUpdatedAt(LocalDateTime.now());
            options.add(option);
        }
        
        questionOptionRepository.saveAll(options);
    }
}