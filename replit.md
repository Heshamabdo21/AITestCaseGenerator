# AI Test Case Generator

## Overview

This is a comprehensive test case management system designed for Azure DevOps integration, featuring AI-powered test case generation, CSV import capabilities, and intelligent test planning. The application serves as a bridge between Azure DevOps and OpenAI, automating the creation of structured test cases from user stories.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type-safe development
- **Tailwind CSS** with Shadcn/UI components for modern, accessible UI
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **React Hook Form** with Zod validation for form handling
- **Framer Motion** for smooth animations and transitions

### Backend Architecture
- **Node.js** with Express.js web framework
- **TypeScript** for type-safe server development
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** as the primary database (with memory storage fallback)
- **Multer** for file upload handling (CSV imports)
- **OpenAI API** integration for AI-powered test case generation

### Database Architecture
- Uses Drizzle ORM with PostgreSQL for production deployments
- Automatic table creation and migration handling
- Fallback to in-memory storage when database is unavailable
- Comprehensive schema covering Azure configs, user stories, test cases, and AI configurations

## Key Components

### 1. Azure DevOps Integration
- **Configuration Management**: Stores organization URL, PAT tokens, and project settings
- **Work Item Synchronization**: Fetches user stories and creates test cases in Azure DevOps
- **Test Plan Management**: Organizes test cases into plans and suites with configurable strategies
- **Test Suite Strategies**: Groups by user story, test type, or single suite organization

### 2. AI-Powered Test Generation
- **OpenAI Integration**: Uses GPT models for intelligent test case creation
- **Context Management**: Maintains project context, domain knowledge, and testing patterns
- **Multiple Test Types**: Supports functional, negative, edge case, security, performance, UI, usability, API, and compatibility tests
- **Platform-Specific Generation**: Tailored test cases for web portal, mobile app, and API testing

### 3. CSV Import System
- **Bulk Import**: Processes CSV files with test case data
- **Format Validation**: Ensures proper CSV structure and data types
- **Test Step Parsing**: Converts CSV rows into structured test steps
- **Enhancement Pipeline**: AI-powered improvement of imported test cases

### 4. Test Case Management
- **Structured Format**: Test cases with objectives, prerequisites, steps, and expected results
- **Status Tracking**: Approval workflow with pending, approved, and rejected states
- **Linking System**: Connects test cases to user stories and requirements
- **Azure DevOps Integration**: Direct push functionality to add test cases to Azure DevOps with proper linking
- **Feedback Collection**: User feedback system for continuous improvement
- **Enhanced Table Actions**: User story-specific and global action buttons for targeted operations
- **Selective Export**: Excel export functionality for individual user stories or selected test cases
- **Batch Operations**: Bulk approve/reject capabilities with clear visual feedback
- **Real-time Azure Sync**: Immediate push to Azure DevOps with error handling and status feedback

### 5. Configuration Systems
- **AI Configuration**: Customizable test generation preferences and complexity levels
- **Environment Configuration**: OS, browser, and device-specific test settings
- **Test Data Configuration**: Reusable test data templates and user credentials

## Data Flow

### Test Case Generation Flow
1. **Configuration Setup**: User configures Azure DevOps connection and AI preferences
2. **User Story Fetch**: System retrieves user stories from Azure DevOps
3. **AI Generation**: OpenAI generates test cases based on user stories and configuration
4. **Review Process**: Generated test cases undergo approval workflow
5. **Azure Integration**: Approved test cases are pushed to Azure DevOps test plans

### CSV Import Flow
1. **File Upload**: User uploads CSV file with test case data
2. **Parsing**: System parses and validates CSV structure
3. **Enhancement**: AI improves imported test cases with additional details
4. **Storage**: Enhanced test cases are stored in the database
5. **Integration**: Test cases can be pushed to Azure DevOps

## External Dependencies

### Required Services
- **Azure DevOps**: Work item management and test plan organization
- **OpenAI API**: AI-powered test case generation and enhancement
- **PostgreSQL**: Production database (optional, falls back to memory storage)

### Optional Integrations
- **Neon Database**: Recommended PostgreSQL hosting service
- **Supabase**: Alternative PostgreSQL hosting option
- **Railway**: Additional PostgreSQL hosting choice

## Deployment Strategy

### Development Environment
- **Replit Integration**: Configured for Replit development environment
- **Hot Reload**: Vite-powered development server with fast refresh
- **PostgreSQL Package**: Included in Nix configuration for local development

### Production Deployment
- **Docker Support**: Multi-stage Dockerfile for optimized production builds
- **Docker Compose**: Complete application stack with PostgreSQL
- **Health Checks**: Built-in health monitoring for container orchestration
- **Auto-scaling**: Configured for autoscale deployment target

### Build Process
- **Frontend Build**: Vite builds React application to `dist/public`
- **Backend Build**: ESBuild bundles server code to `dist/index.js`
- **Asset Optimization**: Static assets served efficiently in production
- **TypeScript Compilation**: Full type checking during build process

## Feature Enhancements

### Test Case Table Action System
The test case interface now supports sophisticated batch operations with clear separation between global and user story-specific actions:

#### Global Actions (Header Level)
- **Approve All Selected**: Mass approval across all test cases with celebration effects
- **Reject All Selected**: Bulk rejection with confirmation feedback
- **Export All**: Complete Excel export of all test cases with structured formatting
- **Select/Deselect All**: Quick selection management across the entire dataset

#### User Story-Specific Actions (Table Level)
- **Select All for User Story**: Toggle selection for all test cases within a specific user story
- **Approve Selected**: Targeted approval for selected test cases within the user story
- **Reject Selected**: Targeted rejection with proper status updates
- **Export Selected**: Filtered Excel export containing only selected test cases from the user story

#### Technical Implementation
- **Dual Selection State**: Independent selection tracking for global and user story-specific operations
- **Backend Export API**: POST endpoint supporting filtered exports via test case ID arrays
- **Excel Generation**: Structured XLSX output with auto-sized columns and proper formatting
- **Visual Feedback**: Loading states, success animations, and clear button labeling

### Interactive UI Hover Animation System
Enhanced user engagement through sophisticated button and element animations:

#### Animation Types
- **Scale Transformations**: Buttons scale 5-10% on hover for immediate visual feedback
- **Icon Animations**: Icons scale and rotate slightly (12 degrees) to indicate interactivity
- **Shadow Effects**: Dynamic shadow generation on hover to create depth perception
- **Color Transitions**: Smooth border and background color changes with 300ms timing
- **Transform GPU**: Hardware acceleration for smooth performance across devices

#### Custom CSS Animations
- **Shimmer Effect**: Subtle light sweep across elements for premium feel
- **Pulse Glow**: Rhythmic glow effect for important actions
- **Bounce Subtle**: Gentle vertical movement for playful interactions
- **Rotation Effects**: Icon rotation on hover to indicate action readiness

#### Implementation Features
- **Group Hover States**: Parent-child animation coordination using CSS group classes
- **Smooth Transitions**: 300ms duration for balanced responsiveness and elegance
- **Performance Optimization**: Transform-GPU and will-change properties for smooth rendering
- **Accessibility Compliance**: Animations respect user motion preferences

## Recent Changes

- June 14, 2025: Successfully migrated from Replit Agent to standard Replit environment
- June 14, 2025: Added Azure DevOps integration buttons to push test cases directly to Azure DevOps
- June 14, 2025: Implemented both global and user story-specific "Add to Azure" functionality
- June 14, 2025: Enhanced error handling for Azure DevOps connectivity issues
- June 14, 2025: Added visual feedback with confetti animations for successful Azure integrations
- June 14, 2025: Implemented interactive UI hover animations for all action buttons
- June 14, 2025: Added scaling, rotation, and shadow effects to enhance user engagement
- June 14, 2025: Created custom CSS animations for shimmer, pulse-glow, and bounce effects
- June 14, 2025: Enhanced pagination controls and table action buttons with smooth transitions
- June 13, 2025: Completed migration from Replit Agent to standard Replit environment
- June 13, 2025: Merged Quick Test Generator and Live Test Case Generator into unified component
- June 13, 2025: Enhanced test generation with dual-mode operation (Quick/Multi-Platform)
- June 13, 2025: Maintained memory storage approach without database dependency
- June 13, 2025: Removed chatbot feature (AI assistant component and API endpoints)

## Changelog

- June 13, 2025. Initial setup and migration completion

## User Preferences

Preferred communication style: Simple, everyday language.
Development approach: Continue without database integration, use memory storage for all functionality.

## Next Development Priorities

Based on the completed test case table enhancements, potential next steps include:

1. **Test Case Filtering Enhancements**
   - Advanced search with multiple criteria
   - Custom filter combinations
   - Saved filter presets

2. **Azure DevOps Integration Improvements**
   - Real-time sync status indicators
   - Bulk Azure operations for selected test cases
   - Test plan organization enhancements

3. **User Experience Refinements**
   - Keyboard shortcuts for common actions
   - Drag-and-drop test case organization
   - Quick preview modals

4. **Export Format Extensions**
   - Additional export formats (PDF, Word)
   - Custom export templates
   - Automated report generation

5. **Test Case Analytics**
   - Approval rate tracking
   - User story completion metrics
   - Quality trend analysis