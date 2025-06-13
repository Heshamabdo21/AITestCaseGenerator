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
- **Feedback Collection**: User feedback system for continuous improvement

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

## Changelog

- June 13, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.