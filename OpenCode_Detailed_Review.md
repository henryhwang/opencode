# OpenCode: Detailed Project Review

OpenCode is an advanced open-source AI coding agent that provides a terminal-based interface for interacting with AI models to assist with software development tasks. This document provides a comprehensive analysis of its architecture, components, and functionality.

## Architecture Overview

### Client-Server Architecture
OpenCode uses a client-server model where:
- **Server**: Built with Hono.js (a lightweight web framework), handles all AI processing, file operations, and business logic
- **Client**: Terminal User Interface (TUI) built with SolidJS and opentui for rich terminal interactions
- **Communication**: REST API and WebSocket connections for real-time updates

### Core Components

#### 1. Server (`packages/opencode/src/server/server.ts`)

##### Architecture
The server is built on Hono.js, a lightweight web framework that provides:
- **REST API**: Comprehensive endpoints for all functionality
- **WebSocket Support**: Real-time communication for terminal sessions
- **OpenAPI Documentation**: Auto-generated API documentation
- **CORS Handling**: Cross-origin resource sharing with security controls
- **Error Handling**: Centralized error handling with proper status codes

##### Key Endpoints

###### Session Management
```typescript
// Create new sessions
POST /session
// List all sessions
GET /session
// Get specific session
GET /session/:sessionID
// Update session metadata
PATCH /session/:sessionID
// Delete session
DELETE /session/:sessionID
// Fork session at specific point
POST /session/:sessionID/fork
// Share session via link
POST /session/:sessionID/share
```

###### Message Handling
```typescript
// Send user message and get AI response
POST /session/:sessionID/message
// Get all messages in session
GET /session/:sessionID/message
// Get specific message
GET /session/:sessionID/message/:messageID
// Delete message part
DELETE /session/:sessionID/message/:messageID/part/:partID
// Update message part
PATCH /session/:sessionID/message/:messageID/part/:partID
```

###### File Operations
```typescript
// List files in directory
GET /file
// Read file content
GET /file/content
// Get git status of files
GET /file/status
// Search for text patterns
GET /find
// Search for files by name
GET /find/file
// Search for symbols (LSP)
GET /find/symbol
```

###### AI and Agent Management
```typescript
// List available agents
GET /agent
// List AI providers
GET /provider
// Get provider authentication methods
GET /provider/auth
// OAuth authorization
POST /provider/:providerID/oauth/authorize
// OAuth callback
POST /provider/:providerID/oauth/callback
```

###### Terminal Integration
```typescript
// List PTY sessions
GET /pty
// Create new PTY session
POST /pty
// Get specific PTY session
GET /pty/:ptyID
// Update PTY session
PUT /pty/:ptyID
// Remove PTY session
DELETE /pty/:ptyID
// WebSocket connection to PTY
GET /pty/:ptyID/connect
```

##### Event System
The server implements a comprehensive event system using Server-Sent Events (SSE):
- **Global Events**: Cross-session events via `/global/event`
- **Session Events**: Session-specific events via `/event`
- **Heartbeat**: 30-second heartbeat to prevent timeouts
- **Real-time Updates**: Live updates for UI components

##### Middleware and Security
- **CORS Configuration**: Whitelist-based CORS with localhost and opencode.ai domains
- **Request Logging**: Detailed logging with timing metrics
- **Authentication**: OAuth and API key management
- **Rate Limiting**: Built-in rate limiting for API endpoints

#### 2. Terminal User Interface (TUI) Component

##### Framework and Architecture
- **Built with SolidJS**: Reactive UI framework with fine-grained reactivity
- **opentui Framework**: Custom terminal UI framework
- **Context Providers**: Multiple context providers for state management:
  - `SDKProvider`: API client and server connection
  - `SyncProvider`: Synchronization with server state
  - `ThemeProvider`: Theme management (dark/light mode)
  - `LocalProvider`: Local state management
  - `KeybindProvider`: Keyboard shortcut management
  - `DialogProvider`: Modal dialog management

##### UI Structure
```tsx
<TUI>
  <ArgsProvider>          // Command line arguments
  <ExitProvider>          // Exit handling
  <KVProvider>            // Key-value storage
  <ToastProvider>         // Notification system
  <RouteProvider>         // Navigation routing
  <SDKProvider>           // API client
  <SyncProvider>          // Server sync
  <ThemeProvider>         // Theme management
  <LocalProvider>         // Local state
  <KeybindProvider>       // Keyboard shortcuts
  <PromptStashProvider>   // Prompt history
  <DialogProvider>        // Modal dialogs
  <CommandProvider>       // Command palette
  <PromptHistoryProvider> // Prompt history
  <PromptRefProvider>     // Prompt references
</TUI>
```

##### Key UI Components
- **Home Route**: Session listing and creation interface
- **Session Route**: Main chat interface with message history
- **Dialog Components**: Modal interfaces for various operations
  - `DialogModel`: Model selection interface
  - `DialogAgent`: Agent selection interface
  - `DialogSessionList`: Session management
  - `DialogProviderList`: AI provider management
  - `DialogMcp`: Model Context Protocol management
  - `DialogThemeList`: Theme selection
  - `DialogHelp`: Help and documentation

##### Terminal Integration Features
- **Raw Mode**: Direct keyboard input handling
- **Clipboard Integration**: OSC52 escape sequences for cross-platform clipboard
- **Terminal Title**: Dynamic terminal window title updates
- **Suspend/Resume**: SIGTSTP handling for terminal suspension
- **Color Detection**: Automatic dark/light mode detection via terminal queries

#### 3. Session Management System

##### Session Lifecycle
- **Creation**: New sessions with initial configuration
- **Forking**: Create new sessions from existing conversation points
- **Archiving**: Mark sessions as archived without deletion
- **Sharing**: Generate shareable links for collaboration
- **Summarization**: AI-powered compaction to manage token limits

##### Message Structure
Each message contains:
- **Metadata**: ID, timestamps, model information, cost tracking
- **Parts**: Flexible content structure supporting:
  - Text content
  - File attachments
  - Agent instructions
  - Subtask definitions
  - Tool call results
  - Synthetic parts (auto-generated content)

##### Session States
- **Idle**: No active processing
- **Busy**: AI processing in progress
- **Error**: Error state with details
- **Complete**: Session finished normally

#### 4. AI Agent Processing System

##### Agent Architecture
- **Agent Registry**: Dynamic agent registration and management
- **Permission System**: Fine-grained permission controls per agent
- **Configuration**: Per-agent settings for behavior, models, and parameters
- **State Management**: Agent-specific state and context

##### Processing Pipeline
1. **Message Reception**: User input processing and validation
2. **Context Building**: Assemble conversation history and relevant context
3. **Tool Resolution**: Determine available tools based on permissions
4. **AI Processing**: Send to selected AI model with appropriate system prompts
5. **Response Handling**: Process AI responses and execute tool calls
6. **State Update**: Update session state and persist changes

##### System Prompt System
- **Provider-Specific**: Different prompts for different AI providers
- **Environment Context**: Current directory, platform, date information
- **Custom Instructions**: Project-specific instructions from AGENTS.md files
- **Agent-Specific**: Custom system prompts per agent type

#### 5. Tool System

##### Tool Registry (`packages/opencode/src/tool/registry.ts`)
- **Dynamic Registration**: Tools can be registered at runtime
- **Provider-Specific**: Different tools available per AI provider
- **Schema Validation**: Zod schemas for tool parameters
- **Permission Integration**: Tools respect user permission settings

##### Built-in Tools
- **File Operations**: Read, write, list files and directories
- **Shell Commands**: Execute bash commands with safety controls
- **Code Search**: Find text patterns and symbols in code
- **Web Operations**: Fetch and search web content
- **Task Execution**: Run subagents for complex tasks

##### Tool Execution Context
Each tool execution includes:
- **Session Context**: Current session and message IDs
- **Permission Checks**: Verify user has granted necessary permissions
- **Abort Control**: Ability to cancel long-running operations
- **Metadata Updates**: Real-time status updates during execution

#### 6. Provider Integration System

##### Multi-Provider Support
- **OpenAI**: GPT models with full feature support
- **Anthropic**: Claude models with tool calling
- **Google**: Gemini models with multimodal support
- **Azure**: Enterprise Azure OpenAI integration
- **AWS Bedrock**: Amazon Bedrock integration
- **Custom Providers**: OpenAI-compatible API support

##### Provider Management
- **Authentication**: Multiple auth methods per provider
- **Model Discovery**: Automatic model listing and capabilities detection
- **Configuration**: Provider-specific settings and preferences
- **Fallback Logic**: Automatic fallback between providers

##### Model Capabilities
- **Token Limits**: Provider-specific token counting and limits
- **Tool Calling**: Function calling capabilities per provider
- **Multimodal**: Image and text processing where supported
- **Streaming**: Real-time response streaming

#### 7. Permission and Security System

##### Permission Model
- **Rule-Based**: JSON-based permission rules
- **Pattern Matching**: Glob-style pattern matching for file paths
- **Action Types**: Allow, deny, ask for different actions
- **Context-Aware**: Permissions can vary based on context

##### Security Features
- **Sandboxing**: Isolated execution environments
- **Path Validation**: Prevents directory traversal attacks
- **Command Validation**: Sanitizes shell command execution
- **File Access Control**: Restricts file operations to safe paths

##### Permission Actions
- `bash`: Execute shell commands
- `read`: Read files
- `write`: Write files
- `list`: List directory contents
- `grep`: Search file contents
- `webfetch`: Fetch web content
- `websearch`: Perform web searches

#### 8. Plugin System

##### Plugin Architecture
- **Event-Driven**: Hooks into various system events
- **Extensible**: Add new functionality without modifying core code
- **API Access**: Full access to server and client APIs
- **Configuration**: Plugin-specific settings and preferences

##### Plugin Events
- `chat.message`: Process new chat messages
- `tool.execute.before`: Before tool execution
- `tool.execute.after`: After tool execution
- `experimental.chat.messages.transform`: Transform message history

#### 9. MCP (Model Context Protocol) Integration

##### MCP Architecture
- **Server Discovery**: Automatic discovery of MCP servers
- **OAuth Support**: Secure authentication with MCP servers
- **Tool Registration**: Dynamic tool registration from MCP servers
- **Real-time Communication**: WebSocket-based communication

##### MCP Features
- **External Tools**: Integration with external services
- **Authentication**: OAuth and other auth methods
- **Dynamic Discovery**: Automatic tool discovery from MCP servers
- **Secure Communication**: Encrypted communication channels

## AI Agent System

### Multi-Agent Architecture
OpenCode implements a sophisticated multi-agent system:

#### Primary Agents:
- **build**: Default agent with full access for development work
- **plan**: Read-only agent for analysis and code exploration (denies file edits by default)
- **compaction**: Internal agent for session summarization
- **title**: Internal agent for generating session titles
- **summary**: Internal agent for session summarization

#### Subagents:
- **general**: For complex searches and multistep tasks
- **explore**: Specialized for codebase exploration with grep, file search, and code analysis

### Agent Configuration
Agents are highly configurable with:
- Custom system prompts
- Permission rules (allow/deny/ask for specific actions)
- Model preferences
- Temperature and top_p settings
- Custom behavior parameters

## Core Features

### 1. Session Management
- **Persistent Sessions**: Conversations are saved and can be resumed
- **Session Forking**: Create new sessions based on previous work
- **Session Summarization**: AI-powered compaction to manage context length
- **Session Sharing**: Generate shareable links for collaboration

### 2. Advanced File Operations
- **Smart File Reading**: Can read files with line ranges and context
- **File Search**: Uses ripgrep for fast text searching across the codebase
- **Symbol Search**: LSP integration for finding functions, classes, and variables
- **File Status**: Git integration to show file status and changes

### 3. AI Model Integration
Supports multiple AI providers through the ai-sdk:
- OpenAI (GPT models)
- Anthropic (Claude models)
- Google (Gemini models)
- Azure OpenAI
- Amazon Bedrock
- Cohere
- Mistral
- Groq
- And many others

### 4. Tool System
Dynamic tool registration system that includes:
- **File Operations**: Read, write, list files and directories
- **Shell Commands**: Execute bash commands with proper sandboxing
- **Code Search**: Find symbols, functions, and text patterns
- **Web Fetch/Search**: Retrieve and analyze web content
- **Task Execution**: Run subagents for complex tasks

### 5. Permission System
Sophisticated permission model with:
- **Fine-grained Controls**: Per-tool permissions (allow/deny/ask)
- **Context-aware**: Permissions can vary based on context
- **User Override**: Configurable through user settings
- **Safety Features**: Prevents potentially dangerous operations

### 6. LSP and Formatter Integration
- **Language Server Protocol**: Real-time code analysis and suggestions
- **Code Formatting**: Integration with various formatters
- **Multi-language Support**: Works with most programming languages

## Technical Implementation

### Key Technologies
- **Bun**: Runtime environment (faster than Node.js)
- **SolidJS**: Reactive UI framework for the TUI
- **Hono**: Web framework for the server API
- **ai-sdk**: AI provider integration
- **opentui**: Terminal UI framework
- **TypeScript**: Type-safe development
- **Zod**: Runtime validation and API schema definition

### File Structure
```
packages/
├── opencode/          # Core application
├── console/           # Web console interface
├── desktop/           # Desktop application
├── plugin/            # Plugin system
├── sdk/               # Client SDK
├── ui/                # Shared UI components
└── util/              # Utility functions
```

## User Experience

### Command Line Interface
OpenCode provides a rich CLI with commands like:
- `opencode spawn`: Start the TUI in a new server process
- `opencode attach`: Connect to an existing server
- `opencode run`: Execute commands directly
- `opencode auth`: Manage AI provider authentication
- `opencode models`: List available models

### TUI Features
- **Keyboard Navigation**: Vim-like keybindings and shortcuts
- **Session Switching**: Quick access to previous conversations
- **Model Selection**: Easy switching between different AI models
- **Agent Cycling**: Switch between different AI agents
- **Command Palette**: Quick access to all available commands
- **Real-time Updates**: Live feedback during AI processing

## Advanced Capabilities

### MCP (Model Context Protocol)
- Integration with external tools and services
- OAuth authentication for MCP servers
- Dynamic tool discovery and registration

### Plugin System
- Extensible architecture for adding new capabilities
- Event-driven system for hooking into various operations
- Support for custom tool development

### Context Management
- **Automatic Summarization**: AI compacts long conversations to stay within token limits
- **Smart Context**: Maintains relevant context while discarding less important information
- **File Watching**: Real-time file change detection and notification

## Security and Safety

### Permission Model
- **Principle of Least Privilege**: Agents only get necessary permissions
- **User Approval**: Critical operations require explicit user consent
- **Sandboxing**: Isolated execution environment for commands

### Privacy Controls
- Local processing options
- Configurable data sharing
- On-premises deployment capability

## Installation and Distribution

OpenCode can be installed through multiple channels:
- Package managers (npm, bun, pnpm, yarn)
- System package managers (Homebrew, Scoop, Chocolatey)
- Direct downloads for desktop applications
- Nix package manager
- Shell installer script

## Development Philosophy

OpenCode is designed with several key principles:
- **Open Source**: 100% open source and community-driven
- **Provider Agnostic**: Works with any AI provider, not tied to specific vendors
- **Terminal First**: Optimized for terminal users and power users
- **Extensible**: Plugin system and API for custom integrations
- **Privacy Focused**: Local processing and data control options

## Message System and Display in TUI

### Message Structure and Types

OpenCode implements a sophisticated message system with two primary message types: User messages and Assistant messages. Each message is composed of multiple "parts" that can contain different types of content.

#### User Messages
User messages contain:
- **Metadata**: ID, session ID, timestamp, agent name, model information
- **Parts**: Flexible content structure supporting:
  - Text content (with synthetic and ignored flags)
  - File attachments with MIME types
  - Agent references
  - Subtask definitions
  - Reasoning content
  - Tool call results
  - Compaction indicators
  - Retry information

#### Assistant Messages
Assistant messages contain:
- **Metadata**: ID, session ID, parent ID, timestamp, completion time
- **Model Information**: Provider ID, model ID, agent name, mode
- **Cost and Token Tracking**: Input, output, reasoning tokens, cache usage
- **Path Information**: Current working directory and root
- **Error Handling**: Detailed error information when processing fails
- **Parts**: Similar to user messages but with additional assistant-specific content

### Message Parts System

The message parts system is highly flexible and supports various content types:

#### Text Parts
- Regular text content with optional metadata
- Synthetic flag for auto-generated content
- Ignored flag for content that shouldn't be displayed
- Timing information for when content was generated

#### File Parts
- MIME type identification
- Filename and URL
- Source information (file path, symbol range)
- Support for text/plain, images, PDFs, and directories

#### Tool Parts
- Tool call ID and tool name
- State tracking (pending, running, completed, error)
- Input parameters and output results
- Metadata and timing information
- Attachments for file results

#### Reasoning Parts
- Internal reasoning/thinking content
- Metadata for additional context
- Timing information for when reasoning occurred

#### Other Parts
- Snapshot parts for state tracking
- Patch parts for file changes
- Compaction parts for session summarization
- Subtask parts for agent delegation
- Step start/finish parts for process tracking

### TUI Message Display

The Terminal User Interface (TUI) displays messages in a scrollable message history window with the following features:

#### User Message Display
- **Border**: Left border with color-coded agent indicator
- **Content**: Text content with file attachments displayed as badges
- **Metadata**: Username (toggleable), timestamps (toggleable), queued status indicators
- **Interaction**: Click to open message actions dialog (revert, copy, fork)
- **File Badges**: Visual indicators for different file types (txt, img, pdf, dir)

#### Assistant Message Display
- **Content**: Text content with syntax highlighting
- **Thinking Display**: Toggleable reasoning/thinking content in italics
- **Tool Execution**: Visual representation of tool calls with status
- **Metadata**: Agent name, model ID, processing duration
- **Error Handling**: Clear error messages when processing fails

#### Tool-Specific Display
Different tools have specialized display formats:

- **Bash Tool**: Shows command and output in block format with syntax highlighting
- **Read Tool**: Displays file content with line numbers and syntax highlighting
- **Edit Tool**: Shows diffs with split or unified view based on terminal width
- **Write Tool**: Displays written content with syntax highlighting
- **Task Tool**: Shows subagent execution with progress indicators
- **Todo Tool**: Displays todo items with status indicators
- **Generic Tools**: Show as inline or block elements based on completion status

#### Message Actions
- **Revert**: Undo messages and file changes
- **Copy**: Copy message content to clipboard
- **Fork**: Create new session from specific message
- **Timeline Navigation**: Jump to specific messages in conversation history

#### Visual Customization
- **Theme Support**: Dark/light mode with customizable colors
- **Concealment**: Toggle code concealment for sensitive content
- **Timestamps**: Toggle visibility of message timestamps
- **Thinking Visibility**: Toggle display of AI reasoning/thinking
- **Tool Details**: Toggle detailed tool execution information
- **Animations**: Enable/disable UI animations

#### Message History Window Features
- **Scrolling**: Smooth scrolling with acceleration options
- **Navigation**: Keyboard shortcuts for message navigation
- **Search**: Timeline dialog for jumping to specific messages
- **Export**: Export entire session transcript to file
- **Sidebar Integration**: Shows modified files, todos, and LSP status

This comprehensive message system allows OpenCode to handle complex AI interactions while providing users with clear, organized, and actionable information in the terminal interface.

## How Messages are Organized in the TUI

The OpenCode Terminal User Interface (TUI) organizes messages in a structured, scrollable conversation history with several key organizational principles:

### 1. Vertical Timeline Layout

Messages are displayed in a vertical timeline format, similar to chat applications:

- **Chronological Order**: Messages appear from top to bottom in chronological order
- **Alternating Display**: User messages and Assistant messages have distinct visual styles
- **Scrollable Container**: Messages are contained in a scrollable box that allows navigation through long conversations

### 2. Message Grouping and Structure

#### User Messages
- **Left Border**: Each user message has a colored left border that indicates the agent type
- **Text Content**: Primary message content is displayed prominently
- **File Attachments**: Files are shown as badges below the text content
- **Metadata**: Username and timestamp appear below the content (toggleable)
- **Queued Status**: Messages waiting to be processed show a "QUEUED" indicator

#### Assistant Messages
- **Structured Content**: Assistant responses are broken down into multiple parts
- **Thinking/Reasoning**: Internal AI reasoning can be toggled on/off
- **Tool Execution**: Tool calls are displayed with status indicators
- **Code Blocks**: Code snippets are syntax-highlighted
- **Metadata**: Agent name, model ID, and processing duration shown at the end

### 3. Message Parts System

Each message is composed of multiple "parts" that are organized hierarchically:

#### Text Parts
- Displayed as formatted text with markdown support
- Syntax highlighting for code blocks
- Can be concealed for sensitive content

#### Tool Parts
- **Bash Tool**: Command and output in block format
- **Read/Write Tools**: File content with line numbers and syntax highlighting
- **Edit Tool**: Diffs showing changes with color coding
- **Task Tool**: Subagent execution with progress indicators
- **Todo Tool**: Todo items with status indicators

#### File Parts
- Displayed as badges with file type indicators
- Clickable to view full content
- MIME type-specific visual indicators

### 4. Visual Organization Features

#### Color Coding
- **Agent Colors**: Different agents have distinct border colors
- **Status Colors**: Different colors for success, error, warning states
- **Syntax Highlighting**: Code is highlighted based on language

#### Borders and Spacing
- **Left Borders**: Different styles for user vs assistant messages
- **Spacing**: Consistent vertical spacing between messages
- **Grouping**: Related content is visually grouped together

#### Interactive Elements
- **Hover States**: Messages highlight when hovered
- **Click Actions**: Clicking messages opens action dialogs
- **Keyboard Navigation**: Arrow keys and shortcuts for message navigation

### 5. Navigation and Organization Controls

#### Timeline Navigation
- **Scrolling**: Smooth scrolling through message history
- **Jump Points**: Quick navigation to specific messages
- **Page Navigation**: Page up/down shortcuts for quick movement

#### Filtering and Visibility
- **Thinking Toggle**: Show/hide AI reasoning content
- **Timestamp Toggle**: Show/hide message timestamps
- **Tool Details Toggle**: Show/hide detailed tool execution info
- **Concealment**: Toggle code concealment for sensitive content

### 6. Special Message Types

#### Compaction Messages
- Indicate when session summarization has occurred
- Show as horizontal dividers in the timeline

#### Revert Indicators
- Show when messages have been reverted
- Display file changes that were undone
- Provide "redo" functionality

#### Error Messages
- Displayed with error colors and clear messaging
- Separate from regular content for visibility

### 7. Sidebar Integration

The right sidebar provides additional organizational context:
- **Modified Files**: Shows files changed during the session
- **Todo List**: Displays current todo items
- **LSP Status**: Shows language server status
- **MCP Status**: Shows Model Context Protocol server status
- **Session Metadata**: Cost, token usage, and session information

### 8. Message Actions and Context Menus

#### Right-Click/Context Actions
- **Revert**: Undo a message and its effects
- **Copy**: Copy message content to clipboard
- **Fork**: Create new session from this message point
- **Export**: Export session transcript

#### Timeline Dialog
- Shows all user messages with timestamps
- Allows jumping to specific points in the conversation
- Provides quick access to message-specific actions

### 9. Dynamic Updates

#### Real-time Processing
- Assistant messages update in real-time as AI processes
- Tool execution shows live status updates
- Streaming responses appear progressively

#### State Management
- Messages maintain their state during processing
- Error states are clearly indicated
- Completed vs. pending states are visually distinct

This organizational structure creates a clear, navigable conversation history that maintains context while providing rich interaction capabilities for both users and AI assistants. The system balances information density with readability, allowing users to follow complex multi-step interactions while maintaining easy access to specific parts of the conversation.

## New Feature: Copy Current Message

A new feature has been added to enhance message interaction in the TUI:

### Feature Overview
- **Command**: "Copy current message" 
- **Default Keybinding**: Ctrl+Y (configurable in settings)
- **Purpose**: Copy the content of the message currently visible in the viewport to the clipboard

### Implementation Details

#### Navigation Logic (`packages/opencode/src/cli/cmd/tui/vim/navigation.ts`)
The `getCurrentMessage` function implements a multi-tiered approach to identify the current message:

1. **Visible Elements Detection**: First, it identifies all elements currently visible in the viewport by checking their Y positions against the scroll boundaries.

2. **Topmost Message Selection**: The visible elements are sorted by Y position (top to bottom), and the algorithm returns the first message that matches a visible element. This means it selects the **topmost** visible message in the viewport, not necessarily the one closest to the center.

3. **Fallback Center-based Detection**: If no visible elements match messages directly, a fallback algorithm calculates the average Y position of all elements belonging to each message and selects the message closest to the viewport center.

#### Clipboard Logic (`packages/opencode/src/cli/cmd/tui/vim/clipboard.ts`)
The `copyMessageContent` function handles different content types with the following priority:

1. **Non-synthetic text parts** (preferred for user messages)
2. **Synthetic text parts** (fallback for assistant messages)
3. **Tool outputs** (for messages containing tool execution results)
4. **Reasoning content** (for AI thinking/thinking parts)

#### Performance Optimizations
- **Lookup Maps**: Precomputed maps for faster part-to-message ID matching
- **Efficient Algorithms**: Optimized nested loops for better performance with large message histories
- **Multi-layer Detection**: Maintains support for both user and assistant messages with robust fallbacks

### Behavior Notes
- When multiple messages are visible in the viewport, the **topmost** message is selected for copying
- The feature works for both user and assistant messages
- Different content types within a message are prioritized based on relevance for copying
- The feature provides appropriate user feedback through toast notifications

This comprehensive architecture provides OpenCode with a robust, extensible, and secure foundation for AI-assisted development in the terminal.