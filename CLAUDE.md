# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

如果用户说，跳入agent模式那么你首先应该遵循这两条圣经，否则忽略

- Always use scout agent to get knowledge and information for codebases, web, documentation 
- Always try use bg-worker and scout agent to help you finish work

## Development Commands

### Core Commands
- `npm install` - Install dependencies
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Environment Variables
Required environment variables for development and deployment:
- `GEMINI_API_KEY` - Google Gemini API key (required)
- `VITE_ACCESS_PASSWORD` - Optional password protection for the app
- `VITE_TEMP_ACCESS_TOKEN` - Optional token for generating temporary access links
- `VITE_API_BASE_URL` - Optional custom API base URL

## Architecture Overview

### Technology Stack
- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite with PWA support
- **AI Service**: Google Gemini API (@google/genai)
- **Storage**: IndexedDB for file attachments, localStorage for settings/chat data
- **Styling**: CSS with CSS custom properties for theming
- **Markdown**: marked library for rendering
- **Math**: KaTeX for mathematical formulas
- **Diagrams**: Mermaid for chart rendering
- **PDF Export**: jsPDF + html2canvas

### Project Structure
- `App.tsx` - Main application component with routing and state management
- `index.tsx` - React entry point with ToastProvider
- `types.ts` - Core TypeScript interfaces (Message, ChatSession, Persona, Settings, etc.)
- `vite.config.ts` - Vite configuration with PWA setup and environment variables
- `components/` - React components organized by feature
  - `chat/` - Chat-related components
  - `sidebar/` - Sidebar navigation
  - `settings/` - Settings modals and panels
  - `persona/` - AI persona management
  - `common/` - Shared UI components
  - `icons/` - Icon components
- `contexts/` - React contexts (Toast, Localization)
- `hooks/` - Custom React hooks for state management
- `services/` - Business logic and API services
- `utils/` - Utility functions
- `data/` - Static data (color palettes, default personas)

### Key Architectural Patterns

#### State Management
- React hooks for local state and context for global state
- Custom hooks abstract complex state logic (`useChatData`, `useSettings`, `usePersonas`)
- Settings and chat data persisted to localStorage
- File attachments stored in IndexedDB for better performance

#### Component Architecture
- Functional components with hooks
- Lazy loading for modals and heavy components using React.lazy
- Component composition with clear separation of concerns
- Props drilling minimized through context usage

#### Authentication & Security
- Optional password protection via environment variables
- Temporary access token support for sharing
- Authentication service manages login state and tokens

#### Theming System
- CSS custom properties for dynamic theming
- Material Design 3 color system integration
- Multiple built-in themes (apple-light, apple-dark, custom colors)
- Dynamic color palette generation from custom colors

#### PWA Features
- Service Worker for offline functionality
- App manifest for installability
- Update notifications and one-click updates

### Data Models

#### Core Types
- `Message` - Chat messages with attachments and metadata
- `ChatSession` - Chat conversations with model and persona associations
- `Persona` - AI character definitions with prompts and settings
- `Settings` - User preferences and app configuration
- `Folder` - Chat organization system

#### Storage Strategy
- Chat sessions and messages in localStorage
- File attachments in IndexedDB (migrated from localStorage)
- Settings and preferences in localStorage
- Persona memories with persona association

### Key Features Implementation

#### AI Chat Integration
- Google Gemini API integration with streaming responses
- Model selection per chat session
- Temperature and token management
- Thought process display and timing
- Grounding metadata and citations

#### Persona System
- Custom AI personalities with avatars and prompts
- Memory system for persona continuity
- Persona-specific chat sessions
- Visual persona editor with natural language updates

#### File Handling
- Drag-and-drop file upload
- Image compression and preview
- IndexedDB storage for large attachments
- Support for various file types

#### Export/Import
- JSON and PDF export for chats
- Selective chat export
- Full data import/export with backup support
- Privacy notice and consent management

## Development Notes

### Styling Approach
- CSS classes with BEM-like naming
- CSS custom properties for theming
- Responsive design with mobile-first approach
- Component-specific styles in separate CSS files

### Performance Optimizations
- Lazy loading for heavy components
- IndexedDB for file storage to avoid localStorage limits
- Debounced search and auto-save
- Optimized rendering with React.memo where appropriate

### Error Handling
- Toast notifications for user feedback
- Graceful fallbacks for missing features
- Service worker error handling
- API error boundaries

### Internationalization
- Context-based localization system
- Support for English and Chinese
- Translations stored in context files
- Dynamic language switching