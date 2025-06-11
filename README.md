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
- **AI Test Case Generation**: Automated test case creation using OpenAI
- **CSV Import/Export**: Bulk import existing test cases from CSV files
- **Test Plan Management**: Organize test cases into structured plans and suites
- **Real-time Updates**: Live updates and collaboration features

### Advanced Features
- **Smart Enhancement**: AI-powered test case improvement and suggestions
- **Feedback System**: Collect and manage feedback on test cases
- **Link Management**: Connect test cases to user stories and requirements
- **Environment Configuration**: Manage different testing environments
- **Data Templates**: Reusable test data configurations

## 🛠 Technologies Used

### Frontend
- **React 18** - Modern UI framework with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - High-quality UI components
- **Wouter** - Lightweight routing
- **TanStack Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Framer Motion** - Smooth animations
- **Lucide React** - Icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe server development
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL** - Production database
- **Zod** - Schema validation
- **OpenAI API** - AI-powered features
- **Multer** - File upload handling

### Development & Deployment
- **Vite** - Fast build tool and development server
- **ESBuild** - Fast JavaScript bundler
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **TSX** - TypeScript execution for development

## 📋 Prerequisites

- **Node.js** (v20 or higher)
- **npm** or **yarn**
- **PostgreSQL** (optional - uses memory storage by default)
- **Docker** (for containerized deployment)

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

4. **Database Setup (Optional)**
   If using PostgreSQL:
   ```bash
   # Create database
   createdb testcases
   
   # Run migrations
   npm run db:push
   ```

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
   - PostgreSQL database (port 5432)
   - Persistent data volumes

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
- **Multi-stage build** for optimized image size
- **Non-root user execution** for security
- **Health checks** for container monitoring
- **Alpine Linux base** for minimal attack surface
- **Persistent volumes** for data storage

## 📁 Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── lib/           # Utility functions
│   │   └── hooks/         # Custom React hooks
├── server/                 # Backend Express application
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Data storage interface
│   ├── csv-parser.ts      # CSV import functionality
│   └── test-case-generator.ts # AI test generation
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema and types
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Multi-container setup
└── README.md             # This file
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

### Health Check
- `GET /api/health` - Container health status

## 🎨 Usage Examples

### Basic Test Case Creation
1. Configure Azure DevOps connection
2. Import user stories from Azure DevOps
3. Generate test cases using AI
4. Review and enhance generated test cases
5. Organize into test plans and suites

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