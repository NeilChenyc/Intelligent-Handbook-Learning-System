# Intelligent Agent-Based Handbook Learning System

🚧 **Currently Under Development** 🚧

A comprehensive AI-powered learning management system that combines intelligent agents with modern web technologies to deliver personalized handbook and compliance training experiences.

## 🎯 System Overview

This project aims to create a complete agent-based learning ecosystem that includes:

- **Frontend Interface**: Modern React-based user interface
- **AI Agent Backend**: Intelligent learning assistants and content processors
- **Learning Analytics**: Advanced progress tracking and performance analysis
- **Content Management**: Dynamic handbook and training material management
- **Compliance Monitoring**: Automated compliance tracking 
## ✨ Key Features

### 🤖 AI-Powered Learning
- **Intelligent Tutoring Agents**: Personalized learning assistance
- **Adaptive Content Delivery**: AI-driven content recommendations
- **Natural Language Processing**: Smart content analysis and Q&A
- **Intelligent Quiz System**: AI-generated adaptive assessments and smart feedback


### 📚 Comprehensive Learning Modules
1. **Learning Dashboard** - Personalized learning overview and recommendations
2. **Task Management** - AI-assisted task prioritization and scheduling
3. **Interactive Quizzes** - Adaptive testing with intelligent feedback
4. **Handbook Studies** - Interactive handbook learning with AI guidance
5. **Progress Tracking** - Advanced analytics and learning insights
6. **Compliance Reports** - Automated compliance monitoring and reporting
7. **Certification Center** - Digital certificate management and verification

### 🎨 Modern User Experience
- **Responsive Design**: Optimized for all devices and screen sizes
- **Intuitive Navigation**: Clean, user-friendly interface design
- **Real-time Feedback**: Instant progress updates and notifications
- **Accessibility**: WCAG compliant design for inclusive learning

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern frontend framework
- **TailwindCSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **Modern Component Design** - Based on shadcn/ui design principles

### Backend (In Development)
- **AI Agents** - Intelligent learning assistants
- **Machine Learning** - Personalized learning algorithms
- **Natural Language Processing** - Content analysis and generation
- **Database** - Learning data and progress storage
- **API Services** - RESTful and GraphQL endpoints

### Infrastructure (Planned)
- **Cloud Deployment** - Scalable cloud infrastructure
- **Microservices** - Modular backend architecture
- **Real-time Communication** - WebSocket for live interactions
- **Security** - Enterprise-grade security measures

## 🚀 Quick Start

> **Note**: Currently only the frontend interface is available. Backend AI agents and services are under active development.

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd intelligent-handbook-system

# Install dependencies
npm install
```

### Development
```bash
# Start the development server
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Build for Production
```bash
# Create production build
npm run build
```

## 📁 Project Structure

### Current Frontend Structure
```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   └── Progress.jsx
│   ├── Header.jsx             # Navigation header
│   ├── Sidebar.jsx            # Main navigation sidebar
│   ├── HomePage.jsx           # Learning dashboard
│   ├── HandbookPage.jsx       # Handbook learning interface
│   ├── QuizPage.jsx           # Interactive quiz system
│   ├── ProgressPage.jsx       # Progress tracking
│   ├── TaskPage.jsx           # Task management
│   ├── ReportPage.jsx         # Compliance reporting
│   ├── CertificatePage.jsx    # Certificate management
│   └── PlaceholderPage.jsx    # Development placeholders
├── lib/
│   └── utils.js              # Utility functions
├── App.jsx                   # Main application component
├── index.js                  # Application entry point
└── index.css                 # Global styles
```

### Planned Full-Stack Architecture
```
intelligent-handbook-system/
├── frontend/                  # React frontend (current)
├── backend/
│   ├── agents/               # AI learning agents
│   ├── api/                  # REST/GraphQL APIs
│   ├── ml/                   # Machine learning models
│   ├── nlp/                  # Natural language processing
│   └── database/             # Data models and migrations
├── infrastructure/           # Deployment and DevOps
├── docs/                     # Documentation
└── tests/                    # End-to-end testing
```

## 🎨 Design Philosophy

### Modern User Interface
- **Clean & Intuitive**: Minimalist design focused on learning efficiency
- **Consistent Design System**: Unified colors, typography, and spacing
- **Smooth Interactions**: Fluid animations and responsive feedback
- **Accessibility First**: WCAG compliant for inclusive learning

### Data-Driven Insights
- **Visual Progress Tracking**: Circular and linear progress indicators
- **Learning Analytics**: Comprehensive performance dashboards
- **Smart Recommendations**: AI-powered content suggestions
- **Real-time Feedback**: Instant learning progress updates

### Scalable Architecture
- **Component-Based Design**: Reusable and maintainable UI components
- **Modular Backend**: Microservices for scalability
- **API-First Approach**: RESTful and GraphQL endpoints
- **Cloud-Native**: Built for modern cloud deployment

## 🗺️ Development Roadmap

### Phase 1: Frontend Foundation ✅
- [x] Modern React interface
- [x] Responsive design system
- [x] Core learning modules
- [x] Interactive quiz system

### Phase 2: AI Agent Integration 🚧
- [ ] Intelligent tutoring agents
- [ ] Natural language processing
- [ ] Personalized learning paths
- [ ] Content recommendation engine

### Phase 3: Advanced Features 📋
- [ ] Real-time collaboration
- [ ] Advanced analytics
- [ ] Mobile applications
- [ ] Enterprise integrations

## 🌐 Browser Support

- **Chrome** (Recommended)
- **Firefox** 90+
- **Safari** 14+
- **Edge** 90+

## 🤝 Contributing

We welcome contributions to this project! Please see our contributing guidelines for more information.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

For questions about this project, please reach out to the development team.

---

**Note**: This is an active development project. Features and architecture may change as we continue to build and refine the system.


## Mapping Table

| Model Input | 描述 | 表来源 | Source Logic / SQL Condition | 对应列 |
| :--- | :--- | :--- | :--- | :--- |
| `timestamp` | Time of prediction | `ly_counter` | `time` column | `T` (e.g., "2023-12-10 08:35:00") |
| `cam1` | Platform YOLO | `ly_counter` | `index = 8` AND `time = T` | `objcount` column |
| `cam2` | Corridor 1 YOLO | `ly_counter` | `index = 13` AND `time = T` | `objcount` column (*Note 1*) |
| `cam3` | Corridor 2 YOLO | `ly_counter` | `index = 14` AND `time = T` | `objcount` column (*Note 1*) |
| `cam4` | Corridor 1 CSRNet | `ly_counter` | `index = 7` AND `time = T` | `density` column (*Note 2*) |
| `cam5` | Corridor 2 CSRNet | `ly_counter` | `index = 12` AND `time = T` | `density` column |
| `cam6` | Underpass YOLO | `ly_counter` | `index = 7` AND `time = T` | `objcount` column |
| `Station4_In` | In-flow (last 30s) | `ly_counter` | `index = 7` | `sum(T) - sum(T - 30s)` |
| `Station4_Out` | Out-flow (last 30s) | `ly_counter` | `index = 8` | `sum(T) - sum(T - 30s)` |
