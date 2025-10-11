# AI MockMate - AI-Powered Mock Interview Platform

## Overview

AI MockMate is a multi-user, AI-powered mock interview platform designed to simulate real-time, conversational interviews for students, professionals, and institutions. The platform combines AI interviewing with automated scoring, grammar and communication evaluation, and career profile generation into one intelligent ecosystem.

The application enables users to practice technical interviews with an AI interviewer, receive comprehensive feedback on their performance across multiple dimensions (grammar, technical accuracy, depth, communication), track their progress over time, and generate ATS-optimized resumes based on their skills and performance data.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack TypeScript Application

**Architecture Pattern**: Monorepo with shared schemas
- **Frontend**: React + TypeScript with Vite bundler
- **Backend**: Node.js + Express.js
- **Shared Layer**: Common TypeScript schemas and types used by both client and server
- **Rationale**: Type safety across the entire stack, reducing runtime errors and improving developer experience. Shared schemas ensure API contracts are enforced at compile time.

### Frontend Architecture

**UI Framework**: React with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query) for server state
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives with custom styling
- **Styling**: Tailwind CSS with custom design system
- **Rationale**: Modern React patterns with minimal dependencies. Wouter provides routing with tiny bundle size. React Query handles caching, synchronization, and background updates automatically.

**Design System**: shadcn/ui (New York style variant)
- **Component Library**: Pre-built accessible components using Radix UI
- **Theming**: Dark mode by default with CSS variables for customization
- **Typography**: Inter for UI/body text, JetBrains Mono for code
- **Color Palette**: Professional dark charcoal background with blue primary accent
- **Rationale**: Professional productivity system combining Linear's minimalism with Notion's information hierarchy. Focuses on clarity during high-stress interview sessions.

**Key Frontend Features**:
- Role-based routing (user/admin/instructor)
- Protected routes with JWT authentication
- Real-time interview interface with turn-based conversation
- Progress tracking and analytics dashboards
- Profile management with automatic skill updates

### Backend Architecture

**Server Framework**: Express.js with TypeScript
- **Authentication**: JWT-based with bcrypt password hashing
- **API Design**: RESTful endpoints with role-based middleware
- **Session Management**: Stateless architecture for LLM interactions
- **Rationale**: Express provides flexibility and extensive middleware ecosystem. JWT tokens enable stateless authentication suitable for scaling. Role-based middleware centralizes authorization logic.

**API Structure**:
- `/api/auth/*` - Authentication (register, login)
- `/api/users/*` - User management
- `/api/topics/*` - Interview topic CRUD
- `/api/questions/*` - Question bank management
- `/api/sessions/*` - Interview session lifecycle
- `/api/stats/*` - User statistics and analytics
- `/api/profile/*` - User profile and resume generation

**Key Backend Features**:
- Stateless LLM request pattern (each turn includes full context)
- Automated scoring with weighted rubric (50% technical, 20% communication, 15% depth, 15% grammar)
- Multi-role access control (user, instructor, admin)
- Seed data for quick development setup

### Database Architecture

**ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Definition**: Type-safe schema definitions with relations
- **Migrations**: Drizzle Kit for schema management
- **Connection**: Neon serverless PostgreSQL with WebSocket support
- **Rationale**: Drizzle provides full type safety with minimal runtime overhead. Neon serverless enables automatic scaling and edge deployment capabilities.

**Data Model**:
- **users**: Authentication and profile data with role-based access
- **topics**: Interview categories (e.g., "JavaScript Fundamentals")
- **questions**: Question bank linked to topics with difficulty levels
- **interview_sessions**: Session metadata and status tracking
- **interview_turns**: Individual Q&A exchanges with AI responses
- **scores**: Evaluation metrics (grammar, technical, depth, communication)

**Design Decisions**:
- UUID primary keys for distributed system compatibility
- JSONB fields for flexible profile data and expected key points
- Timestamp tracking for all entities (createdAt)
- Soft references to enable cascading deletes without strict FK constraints

### AI Integration

**LLM Provider**: Google Gemini AI
- **Integration Pattern**: Stateless request model
- **Context Building**: Each turn includes user profile, session metadata, question, answer, and prior scores
- **Response Format**: Structured JSON with evaluation scores and conversational feedback
- **Rationale**: Stateless design enables horizontal scaling and eliminates state synchronization issues. Gemini provides strong reasoning capabilities for technical evaluation.

**Evaluation System**:
- **Grammar Score** (0-100): Sentence structure, clarity, professional communication
- **Technical Score** (0-100): Accuracy, correct terminology, concept understanding
- **Depth Score** (0-100): Detail level, coverage, thoroughness
- **Communication Score** (0-100): Articulation, logical flow, engagement
- **Total Score Formula**: 0.5×technical + 0.2×communication + 0.15×depth + 0.15×grammar
- **Grade Mapping**: A (90-100), B (80-89), C (70-79), D (60-69), F (<60)

**Prompt Engineering**:
- System prompt configures AI as professional technical interviewer
- Response schema enforces JSON structure with scores, feedback, strengths, and improvement areas
- Natural conversational responses that acknowledge candidate answers

## External Dependencies

### Database & Storage
- **Neon Serverless PostgreSQL**: Primary database with WebSocket support for serverless environments
- **Drizzle ORM**: Type-safe database queries and migrations

### AI & ML Services
- **Google Gemini AI**: LLM for conducting interviews and generating evaluations
- **API Key Required**: `GEMINI_API_KEY` environment variable

### Authentication & Security
- **bcryptjs**: Password hashing (10 rounds)
- **jsonwebtoken**: JWT token generation and verification
- **SESSION_SECRET**: Required environment variable for JWT signing

### UI & Styling
- **Radix UI**: Accessible primitive components (20+ components including dialogs, dropdowns, tooltips)
- **Tailwind CSS**: Utility-first styling with custom theme
- **Lucide React**: Icon library
- **Google Fonts**: Inter (UI/body), JetBrains Mono (code)

### Frontend Libraries
- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **Wouter**: Client-side routing
- **TanStack Query**: Server state management
- **React Hook Form**: Form state and validation
- **Zod**: Schema validation (shared between client/server)

### Development Tools
- **TypeScript**: Type safety across entire stack
- **tsx**: TypeScript execution for development
- **esbuild**: Production bundling for backend
- **Replit Plugins**: Development tooling (cartographer, dev banner, runtime error modal)

### Environment Variables Required
```
DATABASE_URL=postgresql://...
GEMINI_API_KEY=your_gemini_api_key
SESSION_SECRET=your_jwt_secret
NODE_ENV=development|production
```