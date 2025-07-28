# wechat-editor
微信公众号智能排版工具
# 微信公众号智能排版工具 - 部署指南

## 项目概述

这是一个功能完整的微信公众号文章排版工具，包含前端React界面、Node.js后端API和SQLite数据库存储。

### 主要功能特性

1. **智能排版系统**
   - 4种精美的预设样式模板（现代简约、优雅经典、科技风、温馨文艺）
   - 自定义字体大小和主题色
   - 实时预览功能
   - 一键复制HTML到微信公众号

2. **AI智能建议**
   - 自动分析文章结构和内容
   - 提供字数、格式、可读性建议
   - 优化建议记录和追踪

3. **完整的文章管理**
   - 文章保存、编辑、删除
   - 草稿和发布状态管理
   - 文章统计和数据分析

4. **素材管理系统**
   - 图片上传和管理
   - 素材库分类存储
   - 快速插入功能

5. **模板系统**
   - 自定义样式模板
   - 模板分享和使用统计
   - 快速应用模板

6. **多格式导出**
   - HTML格式（适配微信公众号）
   - Markdown格式
   - PDF格式（开发中）

## 技术架构

### 前端技术栈
- **React** - 用户界面框架
- **Tailwind CSS** - 样式框架
- **Lucide React** - 图标库
- **React Hooks** - 状态管理

### 后端技术栈
- **Node.js** - 运行环境
- **Express.js** - Web框架
- **SQLite3** - 数据库
- **JWT** - 身份认证
- **Multer** - 文件上传
- **bcrypt** - 密码加密

### 数据库设计
- users - 用户信息表
- articles - 文章内容表  
- templates - 样式模板表
- materials - 素材资源表
- ai_suggestions - AI建议记录表

## 安装和部署

### 1. 环境要求
- Node.js 16+ 
- npm 或 yarn
- SQLite3

### 2. 安装依赖

```bash
# 后端依赖
npm init -y
npm install express cors multer sqlite3 bcrypt jsonwebtoken
npm install --save-dev nodemon

# 如果使用前端独立部署，还需要安装前端依赖
npm install react react-dom @vitejs/plugin-react vite
npm install tailwindcss lucide-react
```

### 3. 项目结构

```
wechat-editor/
├── server.js              # 后端主文件
├── package.json           # 项目配置
├── .env                   # 环境变量
├── uploads/               # 上传文件目录
├── public/                # 静态文件
├── src/                   # 前端源码
│   ├── components/        # React组件
│   ├── utils/            # 工具函数
│   └── styles/           # 样式文件
└── database/
    └── init.sql          # 数据库初始化脚本
```

### 4. 环境变量配置

创建 `.env` 文件：

```env
# 服务器配置
PORT=3001
NODE_ENV=production

# JWT密钥（请在生产环境中使用强密钥）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# 数据库配置
DB_PATH=./wechat_editor.db

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# 前端URL（CORS配置）
FRONTEND_URL=http://localhost:3000
```

### 5. 启动脚本

在 `package.json` 中添加：

```json
{
  "name": "wechat-editor-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "init-db": "node scripts/init-database.js"
  }
}
```

### 6. 数据库初始化脚本

创建 `scripts/init-database.js`：

```javascript
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'wechat_editor.db');
const db = new sqlite3.Database(dbPath);

console.log('正在初始化数据库...');

db.serialize(() => {
  // 创建所有表结构
  // (表结构代码已在server.js中定义)
  
  // 插入默认样式模板
  const defaultTemplates = [
    {
      name: '现代简约',
      description: '简洁大方的现代风格，适合商务和技术文章',
      style_config: JSON.stringify({
        titleStyle: 'font-size: 24px; font-weight: bold; color: #333; margin: 20px 0; text-align: center; border-bottom: 3px solid #007aff; padding-bottom: 10px;',
        paragraphStyle: 'font-size: 16px; line-height: 1.8; color: #333; margin: 15px 0; text-indent: 2em;',
        quoteStyle: 'background: #f8f9fa; border-left: 4px solid #007aff; padding: 15px; margin: 20px 0; font-style: italic; color: #666;'
      }),
      is_public: 1
    }
    // 可以添加更多默认模板
  ];
  
  // 插入默认模板
  defaultTemplates.forEach(template => {
    db.run(
      'INSERT OR IGNORE INTO templates (user_id, name, description, style_config, is_public) VALUES (0, ?, ?, ?, ?)',
      [template.name, template.description, template.style_config, template.is_public]
    );
  });
});

db.close(() => {
  console.log('数据库初始化完成！');
});
```

## 本地开发

### 1. 启动后端服务

```bash
# 开发模式（自动重启）
npm run dev

# 或者普通启动
npm start
```

服务器将在 `http://localhost:3001` 启动

### 2. API接口说明

#### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/user/profile` - 获取用户信息

#### 文章管理
- `GET /api/articles` - 获取文章列表
- `POST /api/articles` - 创建新文章
- `GET /api/articles/:id` - 获取文章详情
- `PUT /api/articles/:id` - 更新文章
- `DELETE /api/articles/:id` - 删除文章

#### 文件上传
- `POST /api/upload` - 上传图片
- `GET /api/materials` - 获取素材库

#### AI功能
- `POST /api/ai/suggestions` - 获取AI建议

#### 模板管理
- `GET /api/templates` - 获取模板列表
- `POST /api/templates` - 保存自定义模板

#### 统计数据
- `GET /api/stats` - 获取用户统计数据

#### 导出功能
- `GET /api/articles/:id/export/:format` - 导出文章

## 服务器部署

### 1. 使用PM2部署（推荐）

```bash
# 安装PM2
npm install -g pm2

# 创建PM2配置文件 ecosystem.config.js
module.exports = {
  apps: [{
    name: 'wechat-editor',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};

# 启动应用
pm2 start ecosystem.config.js --env production

# 保存PM2配置
pm2 save
pm2 startup
```

### 2. 使用Docker部署

创建 `Dockerfile`：

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p uploads

EXPOSE 3001

CMD ["node", "server.js"]
```

创建 `docker-compose.yml`：

```yaml
version: '3.8'
services:
  wechat-editor:
    build: .
    ports:
      - "3001:3001"
    volumes:
      - ./uploads:/app/uploads
      - ./wechat_editor.db:/app/wechat_editor.db
    environment:
      - NODE_ENV=production
      - JWT_SECRET=your-secret-key
    restart: unless-stopped
```

部署命令：

```bash
docker-compose up -d
```

### 3. Nginx反向代理配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /path/to/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

## 前端构建和部署

### 1. 创建前端构建配置

如果要将React组件构建为独立的前端应用，创建 `vite.config.js`：

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
```

### 2. 前端独立部署

```bash
# 构建前端
npm run build

# 部署到静态文件服务器
cp -r dist/* /var/www/html/
```

## 功能使用说明

### 1. 用户注册和登录

用户首次使用需要注册账号，系统会自动生成JWT token用于身份验证。

### 2. 文章编辑流程

1. 在编辑器中输入文章内容（支持Markdown语法）
2. 选择样式模板（现代简约、优雅经典、科技风、温馨文艺）
3. 调整字体大小和主题色
4. 使用预览功能查看效果
5. 点击"复制HTML"获取格式化代码
6. 粘贴到微信公众号编辑器

### 3. AI智能建议

系统会自动分析文章内容，提供以下建议：
- 文章长度优化
- 标题结构建议
- 格式改进提示
- 可读性优化
- 互动性增强

### 4. 素材管理

- 支持图片上传（JPEG、PNG、GIF、WebP格式）
- 自动生成缩略图
- 支持素材分类和标签
- 快速插入到文章中

### 5. 模板系统

- 使用预设模板快速开始
- 自定义模板保存和分享
- 模板使用统计和排行

## 高级配置和优化

### 1. 性能优化

#### 数据库优化
```sql
-- 添加索引提升查询性能
CREATE INDEX idx_articles_user_id ON articles(user_id);
CREATE INDEX idx_articles_created_at ON articles(created_at);
CREATE INDEX idx_materials_user_id ON materials(user_id);
```

#### 缓存配置
```javascript
// 在server.js中添加Redis缓存
const redis = require('redis');
const client = redis.createClient();

// 缓存热门模板
app.get('/api/templates/popular', async (req, res) => {
  const cacheKey = 'popular_templates';
  const cached = await client.get(cacheKey);
  
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  // 查询数据库并缓存结果
  // ...
});
```

### 2. 安全加固

#### 请求限制
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 100个请求
  message: '请求过于频繁，请稍后再试'
});

app.use('/api', limiter);
```

#### 输入验证
```javascript
const joi = require('joi');

const articleSchema = joi.object({
  title: joi.string().min(1).max(100).required(),
  content: joi.string().min(1).max(50000).required(),
  styleTemplate: joi.string().valid('modern', 'elegant', 'tech', 'warm')
});

app.post('/api/articles', (req, res) => {
  const { error } = articleSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  // 继续处理...
});
```

### 3. 监控和日志

#### 日志配置
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// 在生产环境中添加控制台输出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

#### 健康检查和监控
```javascript
// 健康检查端点
app.get('/health', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    database: 'connected', // 检查数据库连接
    memory: process.memoryUsage()
  };
  
  res.json(healthcheck);
});

// 添加Prometheus监控指标
const prometheus = require('prom-client');
const register = new prometheus.Registry();

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: '请求处理时间',
  labelNames: ['method', 'route', 'status_code']
});

register.registerMetric(httpRequestDuration);
```

## 常见问题和解决方案

### 1. 数据库连接问题
```javascript
// 增加数据库连接重试机制
function connectDB() {
  const db = new sqlite3.Database('./wechat_editor.db', (err) => {
    if (err) {
      console.error('数据库连接失败:', err);
      setTimeout(connectDB, 5000); // 5秒后重试
    } else {
      console.log('数据库连接成功');
    }
  });
  return db;
}
```

### 2. 文件上传问题
```javascript
// 创建上传目录
const fs = require('fs');
const uploadDir = './uploads';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
```

### 3. 跨域问题
```javascript
// 更详细的CORS配置
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://your-domain.com',
      'https://www.your-domain.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('不允许的跨域请求'));
    }
  },
  credentials: true
}));
```

### 4. 内存泄漏防护
```javascript
// 设置请求体大小限制
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 添加请求超时
app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    res.status(408).json({ error: '请求超时' });
  });
  next();
});
```

## 扩展功能建议

### 1. 微信公众号API集成
- 直接发布文章到公众号
- 获取文章阅读数据
- 评论管理功能

### 2. 协作功能
- 多人协作编辑
- 文章评论和审核
- 版本历史管理

### 3. 增强的AI功能
- 文章标题生成
- 内容扩展建议
- SEO优化建议
- 情感分析

### 4. 数据分析
- 阅读量统计
- 用户行为分析
- 热门内容推荐

## 技术支持

如有问题，请查看：
1. 错误日志文件
2. 数据库连接状态
3. 端口占用情况
4. 文件权限设置

联系方式：
- GitHub Issues: [项目地址]
- 邮箱: support@example.com

## 更新日志

### v1.0.0 (2024-07-28)
- 初始版本发布
- 基础排版功能
- 用户认证系统
- 文章管理功能
- AI智能建议
- 多格式导出

---

**注意**: 这是一个功能完整的生产级应用，包含了用户认证、数据存储、文件上传等核心功能。在生产环境中部署时，请确保：

1. 修改默认的JWT密钥
2. 配置合适的数据库备份策略
3. 设置适当的文件上传限制
4. 启用HTTPS加密传输
5. 配置防火墙和安全规则
6. 定期更新依赖包版本

祝你使用愉快！🎉
