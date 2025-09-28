# Learning Platform Backend

基于Spring Boot的学习平台后端服务，集成了LangChain4j AI功能和Supabase数据库。

## 技术栈

- **Java 17**
- **Spring Boot 3.2.1**
- **Spring Security** - 安全认证
- **Spring Data JPA** - 数据访问层
- **PostgreSQL** - 数据库（通过Supabase）
- **LangChain4j** - AI集成
- **Maven** - 依赖管理

## 项目结构

```
src/main/java/com/quiz/
├── agent/                  # AI代理
│   └── PdfQuizAgent.java   # PDF题目生成代理
├── controller/             # 控制器层
│   ├── AuthController.java # 认证控制器
│   ├── CourseController.java # 课程控制器
│   ├── QuizController.java # 题目控制器
│   ├── ProgressController.java # 进度控制器
│   └── ReportController.java # 报告控制器
├── dto/                    # 数据传输对象
│   ├── ApiResponse.java    # 统一API响应格式
│   ├── LoginRequest.java   # 登录请求
│   ├── LoginResponse.java  # 登录响应
│   └── ...                 # 其他DTO
├── entity/                 # 实体类
│   ├── User.java          # 用户实体
│   ├── Course.java        # 课程实体
│   ├── Quiz.java          # 题目实体
│   └── ...                # 其他实体
├── repository/             # 数据访问层
│   ├── UserRepository.java # 用户仓库
│   ├── CourseRepository.java # 课程仓库
│   └── ...                # 其他仓库
├── service/                # 服务层
│   ├── AuthService.java   # 认证服务
│   ├── CourseService.java # 课程服务
│   └── ...                # 其他服务
└── LearningPlatformApplication.java # 应用程序入口
```

## 配置说明

### 环境变量

在运行应用之前，需要设置以下环境变量：

```bash
# Supabase数据库配置
SUPABASE_DB_USERNAME=your_username
SUPABASE_DB_PASSWORD=your_password
SUPABASE_JWT_ISSUER=https://your-project.supabase.co/auth/v1
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI API配置（用于LangChain4j）
OPENAI_API_KEY=your_openai_api_key

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
```

### 数据库配置

项目配置为使用Supabase PostgreSQL数据库。请确保：

1. 在Supabase中创建项目
2. 获取数据库连接信息
3. 配置相应的环境变量

## 运行应用

### 前提条件

- Java 17或更高版本
- Maven 3.6+

### 启动步骤

1. 克隆项目并进入backend目录
2. 设置环境变量
3. 运行应用：

```bash
mvn spring-boot:run
```

应用将在 `http://localhost:8080` 启动。

### 健康检查

访问 `http://localhost:8080/api/health` 检查应用状态。

## API文档

### 基础端点

- `GET /api/health` - 健康检查
- `POST /api/auth/**` - 认证相关（待实现）
- `GET /api/public/**` - 公开接口（待实现）

## 开发指南

### 添加新功能

1. 在相应的包中创建实体类（继承BaseEntity）
2. 创建Repository接口（继承BaseRepository）
3. 创建Service接口和实现类
4. 创建Controller类
5. 添加必要的DTO类

### 异常处理

使用GlobalExceptionHandler进行统一异常处理，所有API响应都使用ApiResponse格式。

### 安全配置

当前配置允许访问认证和公开端点，其他端点需要认证。根据需要调整SecurityConfig。

## 部署

项目可以打包为JAR文件部署：

```bash
mvn clean package
java -jar target/learning-platform-backend-1.0.0.jar
```