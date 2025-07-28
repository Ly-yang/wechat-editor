// server.js - 后端API服务
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// 数据库初始化
const db = new sqlite3.Database('./wechat_editor.db');

// 创建数据表
db.serialize(() => {
  // 用户表
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 文章表
  db.run(`CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    html_content TEXT,
    style_template TEXT DEFAULT 'modern',
    font_size INTEGER DEFAULT 16,
    primary_color TEXT DEFAULT '#007aff',
    is_published BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // 模板表
  db.run(`CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    style_config TEXT NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    use_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // 素材表
  db.run(`CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'image', 'emoji', 'divider'
    name TEXT NOT NULL,
    file_path TEXT,
    url TEXT,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // AI建议记录表
  db.run(`CREATE TABLE IF NOT EXISTS ai_suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    article_id INTEGER,
    suggestion_type TEXT NOT NULL,
    suggestion_content TEXT NOT NULL,
    is_applied BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (article_id) REFERENCES articles (id)
  )`);
});

// 文件上传配置
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB限制
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片文件上传'), false);
    }
  }
});

// JWT认证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '需要认证token' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token无效' });
    }
    req.user = user;
    next();
  });
};

// 用户注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: '所有字段都是必填的' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: '用户名或邮箱已存在' });
          }
          return res.status(500).json({ error: '注册失败' });
        }
        
        const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET);
        res.json({
          token,
          user: { id: this.lastID, username, email }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 用户登录
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  });
});

// 获取用户信息
app.get('/api/user/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, username, email, avatar, created_at FROM users WHERE id = ?', 
    [req.user.id], (err, user) => {
      if (err) {
        return res.status(500).json({ error: '服务器错误' });
      }
      res.json(user);
    });
});

// 保存文章
app.post('/api/articles', authenticateToken, (req, res) => {
  const { title, content, htmlContent, styleTemplate, fontSize, primaryColor } = req.body;
  
  db.run(
    `INSERT INTO articles (user_id, title, content, html_content, style_template, font_size, primary_color) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, title, content, htmlContent, styleTemplate, fontSize, primaryColor],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '保存失败' });
      }
      res.json({ id: this.lastID, message: '文章保存成功' });
    }
  );
});

// 获取用户文章列表
app.get('/api/articles', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  db.all(
    `SELECT id, title, style_template, is_published, view_count, like_count, 
            created_at, updated_at 
     FROM articles 
     WHERE user_id = ? 
     ORDER BY updated_at DESC 
     LIMIT ? OFFSET ?`,
    [req.user.id, limit, offset],
    (err, articles) => {
      if (err) {
        return res.status(500).json({ error: '获取文章失败' });
      }
      
      // 获取总数
      db.get('SELECT COUNT(*) as total FROM articles WHERE user_id = ?', 
        [req.user.id], (err, result) => {
          if (err) {
            return res.status(500).json({ error: '获取文章失败' });
          }
          
          res.json({
            articles,
            pagination: {
              page,
              limit,
              total: result.total,
              pages: Math.ceil(result.total / limit)
            }
          });
        });
    }
  );
});

// 获取单篇文章详情
app.get('/api/articles/:id', authenticateToken, (req, res) => {
  db.get(
    'SELECT * FROM articles WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    (err, article) => {
      if (err) {
        return res.status(500).json({ error: '服务器错误' });
      }
      
      if (!article) {
        return res.status(404).json({ error: '文章不存在' });
      }
      
      res.json(article);
    }
  );
});

// 更新文章
app.put('/api/articles/:id', authenticateToken, (req, res) => {
  const { title, content, htmlContent, styleTemplate, fontSize, primaryColor } = req.body;
  
  db.run(
    `UPDATE articles 
     SET title = ?, content = ?, html_content = ?, style_template = ?, 
         font_size = ?, primary_color = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ? AND user_id = ?`,
    [title, content, htmlContent, styleTemplate, fontSize, primaryColor, req.params.id, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '更新失败' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: '文章不存在' });
      }
      
      res.json({ message: '文章更新成功' });
    }
  );
});

// 删除文章
app.delete('/api/articles/:id', authenticateToken, (req, res) => {
  db.run(
    'DELETE FROM articles WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '删除失败' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: '文章不存在' });
      }
      
      res.json({ message: '文章删除成功' });
    }
  );
});

// 上传图片
app.post('/api/upload', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const fileExtension = path.extname(req.file.originalname);
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
    const filePath = path.join('uploads', fileName);
    
    await fs.rename(req.file.path, filePath);
    
    // 保存到数据库
    db.run(
      'INSERT INTO materials (user_id, type, name, file_path) VALUES (?, ?, ?, ?)',
      [req.user.id, 'image', req.file.originalname, filePath],
      function(err) {
        if (err) {
          return res.status(500).json({ error: '保存文件信息失败' });
        }
        
        res.json({
          id: this.lastID,
          url: `/uploads/${fileName}`,
          name: req.file.originalname
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: '文件上传失败' });
  }
});

// 获取用户素材库
app.get('/api/materials', authenticateToken, (req, res) => {
  const type = req.query.type || 'image';
  
  db.all(
    'SELECT * FROM materials WHERE user_id = ? AND type = ? ORDER BY created_at DESC',
    [req.user.id, type],
    (err, materials) => {
      if (err) {
        return res.status(500).json({ error: '获取素材失败' });
      }
      
      // 为每个素材添加完整URL
      const materialsWithUrl = materials.map(material => ({
        ...material,
        url: material.file_path ? `/${material.file_path}` : material.url
      }));
      
      res.json(materialsWithUrl);
    }
  );
});

// AI智能建议 (模拟AI分析)
app.post('/api/ai/suggestions', authenticateToken, (req, res) => {
  const { content, articleId } = req.body;
  
  // 这里可以接入真正的AI服务，现在先模拟
  const suggestions = generateAISuggestions(content);
  
  // 保存建议到数据库
  suggestions.forEach(suggestion => {
    db.run(
      'INSERT INTO ai_suggestions (user_id, article_id, suggestion_type, suggestion_content) VALUES (?, ?, ?, ?)',
      [req.user.id, articleId, suggestion.type, suggestion.text]
    );
  });
  
  res.json({ suggestions });
});

// AI建议生成函数
function generateAISuggestions(content) {
  const suggestions = [];
  const wordCount = content.length;
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  const hasTitle = content.includes('#');
  const hasHighlight = content.includes('**');
  const hasQuote = content.includes('>');
  
  // 字数建议
  if (wordCount < 300) {
    suggestions.push({
      type: 'length',
      text: '文章内容较短，建议增加更多细节和例子，提升文章价值',
      priority: 'medium'
    });
  } else if (wordCount > 2000) {
    suggestions.push({
      type: 'length',
      text: '文章较长，建议添加小标题分段，提高可读性',
      priority: 'high'
    });
  }
  
  // 标题建议
  if (!hasTitle) {
    suggestions.push({
      type: 'title',
      text: '建议添加标题结构，使用 # 和 ## 创建层次清晰的标题',
      priority: 'high'
    });
  }
  
  // 格式建议
  if (!hasHighlight && wordCount > 200) {
    suggestions.push({
      type: 'format',
      text: '建议使用 **重点内容** 来突出关键信息',
      priority: 'medium'
    });
  }
  
  // 结构建议
  if (paragraphs.length < 3 && wordCount > 500) {
    suggestions.push({
      type: 'structure',
      text: '建议将长段落拆分为多个短段落，提升阅读体验',
      priority: 'medium'
    });
  }
  
  // 互动建议
  if (!content.includes('?') && !content.includes('？')) {
    suggestions.push({
      type: 'engagement',
      text: '建议在文章中添加问句，增加与读者的互动',
      priority: 'low'
    });
  }
  
  return suggestions;
}

// 获取样式模板
app.get('/api/templates', authenticateToken, (req, res) => {
  db.all(
    `SELECT t.*, u.username as author 
     FROM templates t 
     LEFT JOIN users u ON t.user_id = u.id 
     WHERE t.is_public = 1 OR t.user_id = ? 
     ORDER BY t.use_count DESC, t.created_at DESC`,
    [req.user.id],
    (err, templates) => {
      if (err) {
        return res.status(500).json({ error: '获取模板失败' });
      }
      res.json(templates);
    }
  );
});

// 保存自定义模板
app.post('/api/templates', authenticateToken, (req, res) => {
  const { name, description, styleConfig, isPublic } = req.body;
  
  db.run(
    'INSERT INTO templates (user_id, name, description, style_config, is_public) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, name, description, JSON.stringify(styleConfig), isPublic ? 1 : 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '保存模板失败' });
      }
      res.json({ id: this.lastID, message: '模板保存成功' });
    }
  );
});

// 数据统计接口
app.get('/api/stats', authenticateToken, (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total_articles FROM articles WHERE user_id = ?',
    'SELECT COUNT(*) as published_articles FROM articles WHERE user_id = ? AND is_published = 1',
    'SELECT SUM(view_count) as total_views FROM articles WHERE user_id = ?',
    'SELECT SUM(like_count) as total_likes FROM articles WHERE user_id = ?'
  ];
  
  Promise.all(queries.map(query => 
    new Promise((resolve, reject) => {
      db.get(query, [req.user.id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    })
  )).then(results => {
    res.json({
      totalArticles: results[0].total_articles || 0,
      publishedArticles: results[1].published_articles || 0,
      totalViews: results[2].total_views || 0,
      totalLikes: results[3].total_likes || 0
    });
  }).catch(err => {
    res.status(500).json({ error: '获取统计数据失败' });
  });
});

// 导出文章为多种格式
app.get('/api/articles/:id/export/:format', authenticateToken, (req, res) => {
  const { id, format } = req.params;
  
  db.get(
    'SELECT * FROM articles WHERE id = ? AND user_id = ?',
    [id, req.user.id],
    async (err, article) => {
      if (err || !article) {
        return res.status(404).json({ error: '文章不存在' });
      }
      
      try {
        switch (format) {
          case 'html':
            res.setHeader('Content-Type', 'text/html');
            res.setHeader('Content-Disposition', `attachment; filename="${article.title}.html"`);
            res.send(generateHTMLExport(article));
            break;
            
          case 'markdown':
            res.setHeader('Content-Type', 'text/markdown');
            res.setHeader('Content-Disposition', `attachment; filename="${article.title}.md"`);
            res.send(article.content);
            break;
            
          case 'pdf':
            // 这里可以集成PDF生成库
            res.status(501).json({ error: 'PDF导出功能开发中' });
            break;
            
          default:
            res.status(400).json({ error: '不支持的导出格式' });
        }
      } catch (error) {
        res.status(500).json({ error: '导出失败' });
      }
    }
  );
});

// HTML导出模板
function generateHTMLExport(article) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${article.title}</title>
    <style>
        body {
            max-width: 677px;
            margin: 0 auto;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 20px auto;
        }
        .article-meta {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-bottom: 30px;
            border-bottom: 1px solid #eee;
            padding-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="article-meta">
        <p>创建时间: ${new Date(article.created_at).toLocaleDateString()}</p>
        <p>更新时间: ${new Date(article.updated_at).toLocaleDateString()}</p>
    </div>
    ${article.html_content || article.content}
</body>
</html>`;
}

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`API文档: http://localhost:${PORT}/api`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('正在关闭服务器...');
  db.close((err) => {
    if (err) {
      console.error('关闭数据库连接出错:', err);
    } else {
      console.log('数据库连接已关闭');
    }
    process.exit(0);
  });
});
