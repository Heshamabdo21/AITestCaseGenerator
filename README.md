# Test Case Management System

A comprehensive test case management system designed for Azure DevOps integration, featuring AI-powered test case generation, CSV import capabilities, and intelligent test planning.

## 🎯 Objectives

- **Streamline Test Case Management**: Centralize and organize test cases with Azure DevOps integration
- **AI-Enhanced Testing**: Leverage OpenAI to generate comprehensive test cases from user stories
- **Flexible Import Options**: Support CSV import for existing test case migration
- **Intelligent Planning**: Automatically organize test cases into plans and suites
- **Real-time Collaboration**: Enable team collaboration with feedback and linking systems

## 🚀 Key Features

### Core Functionality
- **Azure DevOps Integration**: Direct synchronization with Azure DevOps work items
- **AI Test Case Generation**: Automated test case creation using OpenAI GPT-4o
- **CSV Import/Export**: Bulk import existing test cases from CSV files
- **Test Plan Management**: Organize test cases into structured plans and suites
- **Real-time Updates**: Live updates and collaboration features

### AI-Powered Features
- **Code Assistant with Character**: Interactive AI companion for intelligent code suggestions and test improvements
- **Smart Enhancement**: AI-powered test case improvement and contextual recommendations
- **Automated Analysis**: Test case quality analysis with optimization suggestions
- **Code Generation**: Generate test automation code and test data

### Advanced UI/UX Features
- **Progress Visualization**: Animated milestone tracking with real-time progress indicators
- **Smooth Theme Transitions**: Enhanced dark/light mode switching with fluid animations
- **Interactive Onboarding**: Playful guided tour with contextual hints and animations
- **Copy Feedback System**: One-click code copying with visual confirmation and effects
- **Real-time Notifications**: Toast notifications with smooth animations

### Traditional Features
- **Feedback System**: Collect and manage feedback on test cases
- **Link Management**: Connect test cases to user stories and requirements
- **Environment Configuration**: Manage different testing environments
- **Data Templates**: Reusable test data configurations

## 🛠 Technologies Used

### Frontend
- **React 18** - Modern UI framework with hooks and concurrent features
- **TypeScript** - Type-safe development with strict type checking
- **Tailwind CSS v4** - Latest utility-first CSS framework with enhanced animations
- **Shadcn/UI + Radix UI** - Accessible, high-quality component library
- **Wouter** - Lightweight client-side routing (3.3.5)
- **TanStack Query v5** - Powerful data fetching and state management
- **React Hook Form** - Performant form library with validation
- **Framer Motion** - Production-ready motion library for UI animations
- **Lucide React** - Modern icon library with 1000+ icons

### Backend
- **Node.js 20** - Latest LTS JavaScript runtime
- **Express.js 4** - Minimal web application framework
- **TypeScript** - Full-stack type safety
- **Drizzle ORM** - Type-safe SQL toolkit with zero-runtime overhead
- **PostgreSQL/Memory Storage** - Flexible storage options
- **Zod** - Runtime type validation and parsing
- **OpenAI API v5** - Latest AI integration with GPT-4o model
- **Multer v2** - Advanced file upload handling
- **WebSocket (ws)** - Real-time communication support

### AI & Animation
- **GPT-4o Model** - Latest OpenAI model for intelligent code suggestions
- **Custom AI Assistant** - Context-aware coding companion with personality
- **Framer Motion** - Smooth animations for progress, themes, and interactions
- **CSS Transitions** - Enhanced visual feedback for user actions

### Development & Deployment
- **Vite 5** - Next-generation frontend tooling
- **ESBuild** - Extremely fast JavaScript bundler
- **TSX** - TypeScript execution engine for development
- **Docker Multi-stage** - Optimized containerization
- **Docker Compose** - Development environment orchestration
- **Replit Integration** - Cloud development platform support

## 📋 Prerequisites

- **Node.js** (v20 or higher)
- **npm** or **yarn**
- **PostgreSQL** (optional - uses memory storage by default, automatically configured on Replit)
- **Docker** (for containerized deployment)
- **OpenAI API Key** (for AI-powered test case generation)

## 🔧 Installation

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd test-case-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Optional: Database connection
   DATABASE_URL=postgresql://username:password@localhost:5432/testcases
   
   # Optional: OpenAI API key for AI features
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Optional: Azure DevOps configuration
   AZURE_DEVOPS_ORG=your_organization
   AZURE_DEVOPS_PROJECT=your_project
   AZURE_DEVOPS_PAT=your_personal_access_token
   ```

4. **Database Setup**
   
   **Option A: Replit Database (Automatic)**
   - PostgreSQL is automatically configured with DATABASE_URL
   - Schema is pushed automatically on first run
   
   **Option B: Local PostgreSQL**
   ```bash
   # Create database
   createdb testcases
   
   # Run migrations
   npm run db:push
   ```
   
   **Option C: Memory Storage**
   - Remove DATABASE_URL environment variable
   - Application automatically falls back to memory storage

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5000`

### Production Build

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## 🐳 Docker Deployment

### Quick Start with Docker Compose

1. **Using Docker Compose (Recommended)**
   ```bash
   # Start the complete stack
   docker-compose up -d
   
   # View logs
   docker-compose logs -f
   
   # Stop the stack
   docker-compose down
   ```

   Services included:
   - Application server (port 5000)
   - PostgreSQL database (port 5432) with persistent volumes
   - Automatic health monitoring and restart policies
   - Database schema initialization

### Manual Docker Build

1. **Build Docker image**
   ```bash
   docker build -t test-case-manager .
   ```

2. **Run container**
   ```bash
   # Basic run (memory storage)
   docker run -p 5000:5000 test-case-manager
   
   # With environment variables
   docker run -p 5000:5000 \
     -e DATABASE_URL=postgresql://user:pass@host:5432/db \
     -e OPENAI_API_KEY=your_key \
     test-case-manager
   ```

### Docker Configuration

The Docker setup includes:
- **Multi-stage build** - Optimized production images with separate build/runtime stages
- **Security hardening** - Non-root user execution and minimal attack surface
- **Health monitoring** - Built-in health checks and restart policies
- **Production optimization** - Clean images without build dependencies
- **Data persistence** - Volume mounting for uploads and database storage

## 📁 Project Structure

```
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/        # Reusable UI components

│   │   │   ├── progress-tracker.tsx     # Milestone visualization
│   │   │   ├── copy-feedback.tsx        # Visual copy confirmation
│   │   │   ├── onboarding-tour.tsx      # Interactive user guide
│   │   │   └── enhanced-theme-provider.tsx # Smooth theme transitions
│   │   ├── pages/            # Application pages/routes
│   │   ├── lib/              # Utility functions & configurations
│   │   └── hooks/            # Custom React hooks
│   └── index.html            # Application entry point
├── server/                    # Backend Express application
│   ├── index.ts              # Main server entry point
│   ├── routes.ts             # API route definitions (includes AI endpoints)

│   ├── db.ts                 # Database connection & setup
│   ├── simple-storage.ts     # In-memory storage implementation
│   ├── csv-parser.ts         # CSV import/export functionality
│   ├── demo-data.ts          # Demo data initialization
│   └── vite.ts               # Vite integration for serving frontend
├── shared/                    # Shared types and schemas
│   └── schema.ts             # Database schema with Drizzle & Zod
├── scripts/                   # Utility scripts
│   └── init-db.js            # Database initialization
├── migrations/                # Database migration files
├── attached_assets/          # User-uploaded assets
├── Dockerfile                # Production Docker configuration
├── docker-compose.yml        # Complete stack with PostgreSQL
├── DOCKER_DEPLOYMENT.md      # Docker deployment guide
├── POSTGRESQL_SETUP.md       # Database setup and configuration
├── vite.config.ts            # Vite bundler configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── drizzle.config.ts         # Drizzle ORM configuration
└── README.md                 # This documentation
```

## 🔌 API Endpoints

### Configuration
- `GET /api/azure-config/latest` - Get current Azure DevOps configuration
- `POST /api/azure-config` - Create new configuration
- `PUT /api/azure-config/:id` - Update configuration

### User Stories
- `GET /api/user-stories` - List user stories
- `GET /api/user-stories/azure` - Fetch from Azure DevOps
- `POST /api/user-stories` - Create user story

### Test Cases
- `GET /api/test-cases` - List test cases
- `POST /api/test-cases` - Create test case
- `POST /api/test-cases/generate` - AI-generated test cases
- `POST /api/test-cases/import-csv` - Import from CSV
- `GET /api/test-cases/export-excel` - Export test cases to Excel
- `PATCH /api/test-cases/:id` - Update test case status



### Health Check
- `GET /api/health` - Container health status

## 🎨 Usage Examples

### Basic Test Case Creation
1. Configure Azure DevOps connection
2. Import user stories from Azure DevOps
3. Generate test cases using AI
4. Review and enhance generated test cases
5. Organize into test plans and suites

### AI Assistant Workflow
1. Click the AI assistant button (floating chat icon)
2. Ask for code suggestions: "How can I improve this test case?"
3. Get contextual recommendations and code examples
4. Apply suggestions with one-click copy functionality
5. Use quick action buttons for common improvements

### Interactive Onboarding
1. First-time users automatically see the guided tour
2. Tour highlights key features with animated overlays
3. Interactive elements demonstrate functionality
4. Progress through 6 steps covering main features
5. Skip or restart tour anytime

### Progress Tracking
1. View project milestones in the Progress tab
2. Filter by category (features, testing, deployment)
3. Track completion with animated progress bars
4. Click milestones for detailed information
5. Monitor deadlines and overdue items

### Theme Customization
1. Use the theme toggle in the header
2. Experience smooth transitions between light/dark modes
3. Automatic system preference detection
4. Enhanced visual feedback during theme switches

### CSV Import Workflow
1. Prepare CSV file with test case data
2. Use the import feature to upload CSV
3. Review imported test cases
4. Apply AI enhancements if needed

### AI-Powered Generation
1. Select user stories
2. Configure AI parameters
3. Generate comprehensive test cases
4. Review and customize results

## 🔒 Security Features

- **Input validation** using Zod schemas
- **SQL injection prevention** with parameterized queries
- **File upload restrictions** with size and type limits
- **Non-root container execution**
- **Environment variable security**
- **HTTPS ready** for production deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints
- Examine the Docker logs for troubleshooting

## 🔄 Updates and Maintenance

- Regular dependency updates
- Security patches
- Feature enhancements
- Performance optimizations

---

**Built with ❤️ for efficient test case management**