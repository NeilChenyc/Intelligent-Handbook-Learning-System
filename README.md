# AI-Powered Learning Management System

A comprehensive learning management system with AI agents for PDF-based quiz generation and intelligent chatbot assistance.

## 🎯 System Overview

This is a full-stack learning management system that combines modern web technologies with AI agents to deliver personalized learning experiences:

- **Frontend Interface**: React-based responsive user interface
- **AI Agent Backend**: Two main AI modules - PDF Quiz Generator and Intelligent Chatbot
- **Learning Analytics**: Progress tracking and performance analysis
- **Content Management**: Course and quiz management system
- **Compliance Monitoring**: Automated reporting and certificate management

## ✨ Key Features

### 🤖 AI Agent Modules
- **PDF Quiz Generator Agent**: Automatically generates quizzes from uploaded PDF documents using OpenAI API
- **Intelligent Chatbot Agent**: Provides learning assistance, course guidance, and Q&A support
- **LangChain4j Integration**: Advanced AI service orchestration and natural language processing

### 📚 Learning Management Features
1. **Course Management** - Upload, manage, and organize learning materials
2. **Quiz System** - AI-generated quizzes with multiple question types
3. **Progress Tracking** - Detailed learning analytics and performance metrics
4. **Certificate Management** - Digital certificate generation and verification
5. **Compliance Reports** - Automated compliance monitoring and reporting
6. **Wrong Questions Review** - Track and review incorrect answers for improvement
7. **User Management** - Role-based access control and user administration

### 🎨 Modern User Experience
- **Responsive Design**: Optimized for all devices and screen sizes
- **Intuitive Navigation**: Clean, user-friendly interface design
- **Real-time Feedback**: Instant progress updates and notifications
- **Interactive Components**: Modern UI components with smooth animations

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern frontend framework with hooks
- **TailwindCSS** - Utility-first CSS framework for styling
- **Lucide React** - Beautiful icon library
- **React Markdown** - Markdown rendering with syntax highlighting
- **Highlight.js** - Code syntax highlighting
- **Clsx & Tailwind Merge** - Conditional styling utilities

### Backend
- **Spring Boot 3.2.0** - Java-based backend framework
- **Spring Data JPA** - Database abstraction and ORM
- **PostgreSQL** - Primary database for production
- **H2 Database** - In-memory database for testing
- **LangChain4j 0.27.1** - AI service integration framework
- **OpenAI API** - AI model integration for quiz generation and chatbot
- **OkHttp** - HTTP client for external API calls
- **Lombok** - Java boilerplate code reduction
- **Jackson** - JSON processing and serialization

### Infrastructure & Deployment
- **Azure App Service** - Cloud hosting platform
- **Cloudflare Tunnel** - Secure tunneling for local development
- **Maven** - Java dependency management and build tool
- **GitHub Pages** - Frontend deployment option
- **CORS Configuration** - Cross-origin resource sharing setup

## 🚀 Quick Start

### Prerequisites
- **Java 17+** and Maven 3.6+
- **Node.js 16+** and npm
- **PostgreSQL** database (or use H2 for testing)
- **OpenAI API Key** for AI features
- Modern web browser

### Installation & Setup

#### 1. Backend Setup
```bash
# Navigate to project root
cd /path/to/project

# Configure application.yml with your database and OpenAI settings
# Copy application-example.yml to application.yml and update:
# - Database connection details
# - OpenAI API key
# - Other environment-specific settings

# Build and run backend (first time)
mvn clean install
mvn spring-boot:run
```

#### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Build frontend
npm run build

# Start frontend development server
npm start
```

#### 3. Production Deployment
```bash
# Start backend (production)
java -jar target/quiz-0.0.1-SNAPSHOT.jar

# Start frontend (production)
npm run build && serve -s build
```

### Development Commands
```bash
# Backend
mvn spring-boot:run          # Start backend server
mvn test                     # Run backend tests
mvn clean install           # Build backend

# Frontend  
npm start                   # Start development server
npm test                    # Run frontend tests
npm run build              # Build for production
```

## 📁 Project Structure

```
├── src/main/java/com/quiz/          # Backend Java source
│   ├── agent/                       # AI Agent services
│   │   ├── PdfQuizAgentService.java # PDF quiz generation agent
│   │   └── AgentProcessResult.java  # Agent processing results
│   ├── controller/                  # REST API controllers
│   │   ├── ChatbotController.java   # Chatbot API endpoints
│   │   ├── CourseController.java    # Course management API
│   │   ├── QuizController.java      # Quiz management API
│   │   └── UserController.java      # User management API
│   ├── service/                     # Business logic services
│   │   ├── ChatbotService.java      # Chatbot AI service
│   │   ├── CourseService.java       # Course management service
│   │   ├── QuizService.java         # Quiz processing service
│   │   └── UserService.java         # User management service
│   ├── entity/                      # JPA entities
│   ├── repository/                  # Data access layer
│   ├── dto/                         # Data transfer objects
│   └── config/                      # Configuration classes
├── src/                             # Frontend React source
│   ├── components/                  # Reusable UI components
│   │   ├── ui/                      # Basic UI elements
│   │   └── layout/                  # Layout components
│   ├── pages/                       # Main application pages
│   │   ├── ChatbotPage.jsx          # AI Chatbot interface
│   │   ├── CourseManagementPage.jsx # Course management
│   │   ├── QuizPage.jsx             # Quiz interface
│   │   └── Dashboard.jsx            # Main dashboard
│   ├── api/                         # API integration
│   │   ├── chatbotApi.js            # Chatbot API calls
│   │   ├── courseApi.js             # Course API calls
│   │   └── quizApi.js               # Quiz API calls
│   ├── hooks/                       # Custom React hooks
│   └── utils/                       # Utility functions
├── pom.xml                          # Maven dependencies
├── package.json                     # NPM dependencies
└── README.md                        # This file
```

## 🤖 AI Agent Architecture

### PDF Quiz Generator Agent
- **Input**: PDF documents, quiz parameters (difficulty, question count)
- **Processing**: LangChain4j + OpenAI API for content analysis
- **Output**: Structured quiz questions with multiple choice answers
- **Features**: Automatic content extraction, intelligent question generation

### Chatbot Agent  
- **Input**: User questions, conversation context, PDF content
- **Processing**: OpenAI API with context-aware prompting
- **Output**: Intelligent responses, learning guidance, Q&A support
- **Features**: PDF document analysis, conversational memory, learning assistance

## 🔧 Configuration

### Database Configuration
```yaml
# application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/learning_system
    username: your_username
    password: your_password
  jpa:
    hibernate:
      ddl-auto: update
```

### AI Service Configuration
```yaml
# OpenAI API Configuration
openai:
  api-key: your_openai_api_key
  model: gpt-3.5-turbo
```

## 🚀 Deployment

### Local Development
See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed local setup instructions.

### Production Deployment
- **Backend**: Azure App Service with PostgreSQL
- **Frontend**: GitHub Pages or Azure Static Web Apps
- **Tunnel**: Cloudflare Tunnel for secure connections

## 🎨 Design Philosophy

### User-Centered Design
- **Intuitive Interface**: Clean, modern design that prioritizes user experience
- **Accessibility**: WCAG compliant design for inclusive learning
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Performance**: Fast loading times and smooth interactions

### AI-First Approach
- **Intelligent Automation**: AI agents handle complex content processing
- **Personalized Learning**: Adaptive content delivery based on user progress
- **Natural Interactions**: Conversational AI for seamless user engagement
- **Continuous Improvement**: Machine learning for enhanced user experience

## 🔍 API Documentation

### Core Endpoints

#### Chatbot API
```http
POST /api/chat
Content-Type: application/json

{
  "message": "User question",
  "userId": "user123",
  "sessionId": "session456",
  "conversationHistory": [...],
  "context": {...}
}
```

#### Course Management API
```http
GET /api/courses                    # List all courses
POST /api/courses                   # Create new course
GET /api/courses/{id}               # Get course details
PUT /api/courses/{id}               # Update course
DELETE /api/courses/{id}            # Delete course
```

#### Quiz Generation API
```http
POST /api/quiz/generate
Content-Type: multipart/form-data

{
  "file": [PDF file],
  "difficulty": "medium",
  "questionCount": 10,
  "additionalRequirements": "Focus on key concepts"
}
```

## 🧪 Testing

### Backend Testing
```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=ChatbotServiceTest

# Generate test coverage report
mvn jacoco:report
```

### Frontend Testing
```bash
# Run unit tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run end-to-end tests
npm run test:e2e
```

## 🔒 Security Features

- **Input Validation**: Comprehensive validation for all user inputs
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **API Rate Limiting**: Protection against abuse and DoS attacks
- **Secure File Upload**: Safe handling of PDF document uploads
- **Environment Variables**: Secure configuration management
- **SQL Injection Prevention**: Parameterized queries and JPA protection

## 📊 Performance Metrics

- **Backend Response Time**: < 200ms for standard API calls
- **AI Processing Time**: 2-5 seconds for quiz generation
- **Frontend Load Time**: < 2 seconds initial load
- **Database Query Performance**: Optimized with proper indexing
- **File Upload Limit**: 10MB maximum PDF size

## 🐛 Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check Java version
java -version

# Verify database connection
# Check application.yml configuration

# Clear Maven cache
mvn clean install -U
```

#### Frontend Build Errors
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### AI Services Not Working
- Verify OpenAI API key in configuration
- Check network connectivity
- Review API usage limits and billing

### macOS Security Issues
If you encounter security warnings on macOS:
1. Go to System Preferences → Security & Privacy
2. Click "Allow Anyway" for blocked applications
3. Or use: `sudo spctl --master-disable` (not recommended for production)

## 🌐 Browser Support

- **Chrome** (Recommended)
- **Firefox** 90+
- **Safari** 14+
- **Edge** 90+

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Development Process
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards
- **Java**: Follow Google Java Style Guide
- **JavaScript/React**: Use ESLint and Prettier configurations
- **Documentation**: Update README and code comments
- **Testing**: Include unit tests for new features

### Issue Reporting
- Use GitHub Issues for bug reports and feature requests
- Provide detailed reproduction steps
- Include system information and error logs

## 📞 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact the development team for urgent matters

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses
- **Spring Boot**: Apache License 2.0
- **React**: MIT License
- **TailwindCSS**: MIT License
- **LangChain4j**: Apache License 2.0
- **OpenAI API**: Commercial License (API usage)

## 🙏 Acknowledgments

- **OpenAI** for providing powerful AI capabilities
- **LangChain4j** team for excellent AI service orchestration
- **Spring Boot** community for the robust backend framework
- **React** team for the modern frontend framework
- **TailwindCSS** for the utility-first CSS framework
- All **contributors** and **supporters** of this project

## 🔮 Future Roadmap

### Short Term (Next 3 months)
- [ ] Enhanced quiz question types (fill-in-the-blank, matching)
- [ ] Improved chatbot conversation memory
- [ ] Advanced user analytics dashboard
- [ ] Mobile app development

### Medium Term (6 months)
- [ ] Multi-language support
- [ ] Advanced AI tutoring features
- [ ] Integration with external LMS platforms
- [ ] Real-time collaboration features

### Long Term (1 year+)
- [ ] Voice interaction capabilities
- [ ] AR/VR learning experiences
- [ ] Advanced learning path recommendations
- [ ] Enterprise-grade features and integrations

---

**Status**: ✅ **Production Ready** - Fully functional AI-powered learning management system with active development and support.

**Last Updated**: December 2024
