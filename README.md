# 剧本解析工具

一个强大的剧本内容解析和分类管理系统，基于Koa2 + MySQL构建，支持MCP（Model Context Protocol）集成。

## ✨ 功能特性

- 🎭 **剧本项目管理** - 创建和管理多个剧本解析项目
- 🏷️ **智能分类** - 自动按人物、场景、道具、情节、对话、动作等标签分类
- 🔧 **MCP集成** - 支持Claude等AI客户端通过MCP协议远程操作
- 🔐 **安全认证** - 基于API Key的多层安全防护机制
- 📊 **数据洞察** - 提供详细的项目统计和分析信息
- 🌐 **RESTful API** - 完整的HTTP API接口
- 📱 **响应式界面** - 现代化的Web管理界面

## 🛠️ 技术栈

**后端框架**
- Node.js + Koa2
- MySQL 数据库
- API Key 认证
- CORS 跨域支持

**前端技术**
- HTML5 + CSS3
- 原生 JavaScript (ES6+)
- Fetch API

**MCP集成**
- @modelcontextprotocol/sdk
- Axios HTTP 客户端
- 双向通信协议

## 📋 环境要求

- Node.js >= 14.0.0
- MySQL >= 5.7
- npm 或 yarn

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd ScriptAnalysisTool
```

### 2. 安装依赖
```bash
# 安装主应用依赖
npm install

# 安装MCP服务器依赖
cd script-mcp-server
npm install
cd ..
```

### 3. 配置环境
复制环境变量模板并修改配置：
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=scriptanalysisdb

# API安全配置
API_KEY=your-secure-api-key
MCP_API_KEY=your-mcp-api-key
PORT=3001

# CORS配置
ALLOWED_ORIGINS=*
NODE_ENV=development
```

### 4. 数据库设置
确保MySQL服务运行，应用将自动创建数据库和表结构。

### 5. 启动应用
```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

### 6. 启动MCP服务器
```bash
cd script-mcp-server
npm start
```

### 7. 访问应用
打开浏览器访问 `http://localhost:3001/index.html`

## 📖 API文档

### 剧本项目管理

#### 创建剧本项目
```http
POST /api/scripts
Content-Type: application/json

{
  "name": "项目名称",
  "description": "项目描述"
}
```

#### 获取项目列表
```http
GET /api/scripts
```

#### 获取项目详情
```http
GET /api/scripts/:id
```

#### 解析剧本内容 (MCP专用)
```http
POST /api/scripts/:id/parse
Content-Type: application/json

{
  "tag_type": "人物",
  "items": [
    {
      "content": "原始内容",
      "summary": "内容摘要",
      "metadata": {}
    }
  ]
}
```

#### 按标签获取数据
```http
GET /api/scripts/:id/tag/:tagType
```

#### 获取标签类型列表
```http
GET /api/scripts/tag-types/list
```

## 🔧 MCP工具说明

本系统提供以下MCP工具供Claude等AI客户端调用：

| 工具名称 | 功能描述 |
|---------|---------|
| `create_script_project` | 创建新的剧本项目 |
| `list_script_projects` | 获取所有项目列表 |
| `get_script_project` | 获取项目详细信息 |
| `parse_script_content` | **核心功能** - 解析剧本内容并分类存储 |
| `get_script_data_by_tag` | 根据标签类型获取解析数据 |
| `list_tag_types` | 获取所有可用标签类型 |
| `delete_script_project` | 删除剧本项目 |

### MCP服务器配置
编辑 `script-mcp-server/.env`:
```env
SCRIPT_API_URL=http://localhost:3001
SCRIPT_API_KEY=your-mcp-api-key
```

## 🗄️ 数据库结构

### script_projects (剧本项目表)
- `id` - 项目ID
- `name` - 项目名称  
- `description` - 项目描述
- `created_at`, `updated_at` - 时间戳

### tag_types (标签类型表)
- `id` - 标签ID
- `name` - 标签名称（人物、场景、道具等）
- `description` - 标签描述

### script_data (解析数据表)
- `id` - 数据ID
- `project_id` - 关联项目
- `tag_type_id` - 关联标签类型
- `content` - 原始内容
- `summary` - 内容摘要
- `metadata` - JSON元数据

## 🚀 部署指南

### 生产环境配置

1. **环境变量设置**
```bash
export NODE_ENV=production
export DB_PASSWORD=secure_password
export API_KEY=$(openssl rand -hex 32)
export MCP_API_KEY=$(openssl rand -hex 32)
```

2. **使用PM2管理进程**
```bash
PORT=3001 pm2 start server.js --name script-analysis-tool
```

3. **Nginx反向代理配置**
```nginx
location /script/ {
    proxy_pass http://127.0.0.1:3001/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### GitHub Actions自动部署
项目已配置GitHub Actions，推送到main分支将自动部署到服务器。

### 双项目部署配置
如果服务器上同时运行多个项目，需要注意以下配置：

**端口分配：**
- TodoList项目：3000端口
- ScriptAnalysisTool项目：3001端口

**数据库分离：**
- TodoList项目：`todoapp` 数据库
- ScriptAnalysisTool项目：`scriptanalysisdb` 数据库

**PM2进程管理：**
```bash
# TodoList项目
pm2 start server.js --name todolist

# ScriptAnalysisTool项目  
PORT=3001 pm2 start server.js --name script-analysis-tool
```

**Nginx配置：**
```nginx
# 主域名指向TodoList
location / {
    proxy_pass http://127.0.0.1:3000;
}

# 子路径指向ScriptAnalysisTool
location /script/ {
    proxy_pass http://127.0.0.1:3001/;
}
```

## 🔒 安全特性

- **多层API Key认证** - 支持通用和MCP专用密钥
- **请求频率限制** - 防止API滥用（1000次/15分钟）
- **输入内容清理** - 自动过滤恶意代码
- **CORS安全配置** - 可配置的跨域访问控制
- **错误信息保护** - 生产环境隐藏敏感信息

## 📝 开发说明

### 项目结构
```
ScriptAnalysisTool/
├── config/
│   └── database.js          # 数据库配置和初始化
├── middleware/
│   ├── auth.js              # 认证中间件
│   └── security.js          # 安全防护中间件
├── routes/
│   └── scripts.js           # 剧本API路由
├── script-mcp-server/       # MCP服务器
│   └── src/
│       └── index.js         # MCP服务器主文件
├── migrations/              # 数据库迁移脚本
├── index.html               # 前端界面
├── script.js                # 前端逻辑
├── style.css                # 样式文件
└── server.js                # 主服务器文件
```

### 开发命令
```bash
# 开发模式启动主应用
npm run dev

# 开发模式启动MCP服务器  
cd script-mcp-server && npm run dev

# 打包项目
npm run package

# 数据库迁移（删除旧的todos表）
mysql -u root -p < migrations/001_remove_todos_table.sql
```

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开Pull Request

## 📄 许可证

本项目采用 ISC 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 创建 [Issue](../../issues)
- 发送邮件至: [your-email@example.com]

---

**🎭 让AI帮你更好地理解和分析剧本内容！**