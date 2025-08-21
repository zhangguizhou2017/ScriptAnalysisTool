# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start the application:**
```bash
npm start                    # Production mode
npm run dev                  # Development mode with nodemon
```

**Package for deployment:**
```bash
npm run package             # Creates script-analysis-tool.zip for deployment
```

**MCP Server (script-mcp-server/):**
```bash
cd script-mcp-server
npm start                   # Start MCP server
npm test                    # Test MCP functionality
```

## Project Architecture

This is a **Script Analysis Tool** that evolved from a Todo application, now featuring dual functionality:

### 1. Core Application (Koa.js + MySQL)
- **Server:** `server.js` - Main Koa.js server running on port 3001
- **Database:** MySQL with connection pooling via `config/database.js`
- **Routes:** RESTful APIs for script analysis (`/api/scripts/*`)
- **Security:** Multi-layer protection via `middleware/security.js` and `middleware/auth.js`

### 2. MCP Integration Layer
- **MCP Server:** `script-mcp-server/src/index.js` - Model Context Protocol server for Claude integration
- **Tools Provided:** Script parsing, project management, data classification
- **Protocol:** Bi-directional communication between Claude clients and the script analysis backend

### Database Schema
The application manages three main entities:

**script_projects:** Core projects containing script analysis data
```sql
- id, name, description, timestamps
```

**tag_types:** Classification categories (人物/角色, 场景, 道具, 情节, 对话, 动作)
```sql
- id, name, description, created_at
```

**script_data:** Parsed content linked to projects and tag types
```sql
- project_id, tag_type_id, content, summary, metadata (JSON), timestamps
```


### API Architecture
The application provides **Script APIs** (`/api/scripts/*`) for script analysis and project management:
   - `POST /` - Create script projects
   - `GET /:id` - Project details with classified data
   - `POST /:id/parse` - Core parsing endpoint for MCP tools
   - `GET /:id/tag/:tagType` - Retrieve data by classification

### Security Model
- **API Key Authentication:** Dual-key system supporting both general and MCP-specific keys
- **Optional vs Forced Auth:** Different endpoints have different security requirements
- **Input Sanitization:** Recursive cleaning of user input
- **Rate Limiting:** IP-based throttling (1000 requests/15 minutes)
- **CORS Configuration:** Environment-based origin control

### MCP Integration Details
The MCP server (`script-mcp-server/`) provides 7 tools for Claude:
- `create_script_project`, `list_script_projects`, `get_script_project`
- `parse_script_content` (core functionality)
- `get_script_data_by_tag`, `list_tag_types`, `delete_script_project`

**Key Integration Points:**
- MCP server communicates with main app via HTTP API
- Authentication handled through `X-API-Key` headers
- Error handling with user-friendly Chinese messages
- Real-time status logging for debugging

## Environment Configuration

**Required Variables:**
```bash
# Database
DB_HOST=localhost
DB_PORT=3306  
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=scriptanalysisdb

# API Security
API_KEY=your-secure-api-key
MCP_API_KEY=your-mcp-specific-key

# Server
PORT=3001  # Changed from 3000 to avoid conflicts

# MCP Server Configuration  
SCRIPT_API_URL=http://your-domain.com
SCRIPT_API_KEY=your-api-key
```

## Deployment Architecture

**Production Setup:**
- Main app runs on port 3001 (configured for dual deployment)
- PM2 process management with `script-analysis-tool` process name
- GitHub Actions automated deployment to `/www/wwwroot/ScriptAnalysisTool`
- Nginx reverse proxy configuration for path-based routing (`/script/` → port 3001)

**Database Initialization:**
The `config/database.js` automatically:
1. Creates database if not exists
2. Sets up all required tables with foreign keys
3. Inserts default tag types for script classification
4. Configures connection pooling

## Frontend Integration

**Static Files:**
- `index.html` - Main UI for script project management
- `style.css` - Responsive styling
- `script.js` - Frontend API integration

**API Communication:**
Frontend directly calls REST endpoints, while MCP tools provide programmatic access for Claude-driven interactions.