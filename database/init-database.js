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
