import React, { useState, useRef, useEffect } from 'react';
import { 
  Save, Copy, Download, Upload, Palette, Type, 
  Image, Link, Bold, Italic, Underline, List, 
  AlignLeft, AlignCenter, AlignRight, Eye, 
  Settings, Wand2, FileText, Smartphone,
  BookOpen, Lightbulb, Zap, Star, Heart
} from 'lucide-react';

const WeChatEditor = () => {
  const [content, setContent] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('modern');
  const [fontSize, setFontSize] = useState(16);
  const [primaryColor, setPrimaryColor] = useState('#007aff');
  const [savedArticles, setSavedArticles] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const editorRef = useRef(null);

  // 预设样式模板
  const styleTemplates = {
    modern: {
      name: '现代简约',
      titleStyle: 'font-size: 24px; font-weight: bold; color: #333; margin: 20px 0; text-align: center; border-bottom: 3px solid #007aff; padding-bottom: 10px;',
      paragraphStyle: 'font-size: 16px; line-height: 1.8; color: #333; margin: 15px 0; text-indent: 2em;',
      quoteStyle: 'background: #f8f9fa; border-left: 4px solid #007aff; padding: 15px; margin: 20px 0; font-style: italic; color: #666;',
      highlightStyle: 'background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%); padding: 2px 8px; border-radius: 4px;'
    },
    elegant: {
      name: '优雅经典',
      titleStyle: 'font-size: 22px; font-weight: 600; color: #2c3e50; margin: 25px 0; text-align: center; font-family: "PingFang SC", "Hiragino Sans GB", sans-serif;',
      paragraphStyle: 'font-size: 15px; line-height: 1.9; color: #34495e; margin: 18px 0; text-indent: 2em;',
      quoteStyle: 'background: #ecf0f1; border: 1px solid #bdc3c7; padding: 20px; margin: 25px 0; border-radius: 8px; color: #7f8c8d;',
      highlightStyle: 'color: #e74c3c; font-weight: 600; background: #ffeaa7; padding: 2px 6px; border-radius: 3px;'
    },
    tech: {
      name: '科技风',
      titleStyle: 'font-size: 26px; font-weight: bold; color: #00d4aa; margin: 20px 0; text-align: center; text-shadow: 0 0 10px rgba(0, 212, 170, 0.3); font-family: "SF Pro Display", sans-serif;',
      paragraphStyle: 'font-size: 16px; line-height: 1.7; color: #2d3748; margin: 16px 0; text-indent: 2em;',
      quoteStyle: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: 20px 0; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);',
      highlightStyle: 'background: linear-gradient(45deg, #ff6b6b, #feca57); color: white; padding: 3px 8px; border-radius: 20px; font-weight: 600;'
    },
    warm: {
      name: '温馨文艺',
      titleStyle: 'font-size: 20px; font-weight: 500; color: #d63384; margin: 25px 0; text-align: center; border-top: 2px dotted #f8d7da; border-bottom: 2px dotted #f8d7da; padding: 15px 0;',
      paragraphStyle: 'font-size: 15px; line-height: 2; color: #495057; margin: 20px 0; text-indent: 2em;',
      quoteStyle: 'background: #fff3cd; border: 2px solid #ffeaa7; padding: 18px; margin: 20px 0; border-radius: 15px; color: #856404; position: relative;',
      highlightStyle: 'background: #ff7675; color: white; padding: 2px 10px; border-radius: 15px; font-size: 14px;'
    }
  };

  // AI 智能建议功能
  const generateAISuggestions = () => {
    const suggestions = [
      { type: 'title', text: '建议使用更吸引人的标题，比如添加数字或问句' },
      { type: 'structure', text: '文章结构可以优化，建议添加小标题分段' },
      { type: 'readability', text: '段落较长，建议分解为更短的段落提高可读性' },
      { type: 'engagement', text: '可以添加一些互动元素，如提问或引用' }
    ];
    setAiSuggestions(suggestions);
  };

  // 应用样式到内容
  const applyStyle = (text) => {
    const template = styleTemplates[selectedStyle];
    let styledText = text;
    
    // 应用标题样式
    styledText = styledText.replace(/^# (.+)$/gm, `<h1 style="${template.titleStyle}">$1</h1>`);
    styledText = styledText.replace(/^## (.+)$/gm, `<h2 style="${template.titleStyle.replace('24px', '20px')}">$1</h2>`);
    
    // 应用段落样式
    styledText = styledText.replace(/^(?!<[^>]+>)(.+)$/gm, `<p style="${template.paragraphStyle}">$1</p>`);
    
    // 应用引用样式
    styledText = styledText.replace(/^> (.+)$/gm, `<blockquote style="${template.quoteStyle}">$1</blockquote>`);
    
    // 应用高亮样式
    styledText = styledText.replace(/\*\*(.+?)\*\*/g, `<span style="${template.highlightStyle}">$1</span>`);
    
    return styledText;
  };

  // 复制到剪贴板
  const copyToClipboard = () => {
    const styledContent = applyStyle(content);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(styledContent);
      alert('已复制到剪贴板，可直接粘贴到微信公众号后台！');
    }
  };

  // 保存文章
  const saveArticle = () => {
    const article = {
      id: Date.now(),
      title: content.split('\n')[0]?.replace('#', '').trim() || '未命名文章',
      content: content,
      style: selectedStyle,
      createdAt: new Date().toLocaleDateString()
    };
    setSavedArticles([...savedArticles, article]);
    alert('文章已保存！');
  };

  // 加载文章
  const loadArticle = (article) => {
    setContent(article.content);
    setSelectedStyle(article.style);
  };

  // 导出为HTML
  const exportHTML = () => {
    const styledContent = applyStyle(content);
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>微信公众号文章</title>
    <style>
        body { max-width: 677px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        img { max-width: 100%; height: auto; }
    </style>
</head>
<body>
    ${styledContent}
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '微信公众号文章.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Wand2 className="w-8 h-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">智能排版助手</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button onClick={generateAISuggestions} className="flex items-center space-x-1 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                <Lightbulb className="w-4 h-4" />
                <span>AI建议</span>
              </button>
              <button onClick={() => setPreviewMode(!previewMode)} className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                <Eye className="w-4 h-4" />
                <span>{previewMode ? '编辑' : '预览'}</span>
              </button>
              <button onClick={saveArticle} className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                <Save className="w-4 h-4" />
                <span>保存</span>
              </button>
              <button onClick={copyToClipboard} className="flex items-center space-x-1 px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors">
                <Copy className="w-4 h-4" />
                <span>复制HTML</span>
              </button>
              <button onClick={exportHTML} className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>导出</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* 左侧样式选择器 */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  样式模板
                </h3>
                <div className="space-y-3">
                  {Object.entries(styleTemplates).map(([key, template]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedStyle(key)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedStyle === key
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{template.name}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {key === 'modern' && '简洁大方，适合商务文章'}
                        {key === 'elegant' && '优雅经典，适合人文内容'}
                        {key === 'tech' && '科技感强，适合技术文章'}
                        {key === 'warm' && '温馨文艺，适合生活分享'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  样式设置
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">字体大小</label>
                    <input
                      type="range"
                      min="12"
                      max="20"
                      value={fontSize}
                      onChange={(e) => setFontSize(e.target.value)}
                      className="w-full"
                    />
                    <span className="text-sm text-gray-500">{fontSize}px</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">主题色</label>
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full h-10 rounded border"
                    />
                  </div>
                </div>
              </div>

              {/* AI建议面板 */}
              {aiSuggestions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                    AI智能建议
                  </h3>
                  <div className="space-y-2">
                    {aiSuggestions.map((suggestion, index) => (
                      <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="text-sm text-yellow-800">{suggestion.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 已保存文章 */}
              {savedArticles.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    已保存文章
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {savedArticles.map((article) => (
                      <button
                        key={article.id}
                        onClick={() => loadArticle(article)}
                        className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium text-gray-900 truncate">{article.title}</div>
                        <div className="text-sm text-gray-500">{article.createdAt}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 中间编辑器 */}
          <div className="col-span-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="border-b p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {previewMode ? '预览模式' : '编辑模式'}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-500">677px宽度（微信标准）</span>
                  </div>
                </div>
              </div>
              
              {previewMode ? (
                <div 
                  className="p-6 min-h-96"
                  style={{ maxWidth: '677px', margin: '0 auto' }}
                  dangerouslySetInnerHTML={{ __html: applyStyle(content) }}
                />
              ) : (
                <textarea
                  ref={editorRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="在这里输入你的文章内容...

支持Markdown语法：
# 一级标题
## 二级标题
**粗体文字**
> 引用内容

小贴士：
- 使用 # 创建标题
- 使用 ** 包围文字创建重点内容
- 使用 > 创建引用块
- 每段之间留空行获得更好的排版效果"
                  className="w-full h-96 p-6 border-0 resize-none focus:outline-none focus:ring-0"
                  style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}
                />
              )}
            </div>
          </div>

          {/* 右侧功能面板 */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  写作助手
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setContent(content + '\n\n**重点内容**\n')}
                    className="p-2 border rounded hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Bold className="w-4 h-4 mx-auto mb-1" />
                    重点
                  </button>
                  <button 
                    onClick={() => setContent(content + '\n\n> 引用内容\n')}
                    className="p-2 border rounded hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Type className="w-4 h-4 mx-auto mb-1" />
                    引用
                  </button>
                  <button 
                    onClick={() => setContent(content + '\n\n## 小标题\n')}
                    className="p-2 border rounded hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Type className="w-4 h-4 mx-auto mb-1" />
                    标题
                  </button>
                  <button 
                    onClick={() => setContent(content + '\n\n---\n')}
                    className="p-2 border rounded hover:bg-gray-50 transition-colors text-sm"
                  >
                    <List className="w-4 h-4 mx-auto mb-1" />
                    分割线
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  快速模板
                </h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => setContent(`# 文章标题

## 引言
在这里写一个吸引读者的开头...

## 主要内容
详细展开你的观点和内容...

## 总结
总结文章的主要观点...

> 感谢阅读，欢迎点赞和分享！`)}
                    className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">通用文章模板</div>
                    <div className="text-sm text-gray-500">标准的文章结构</div>
                  </button>
                  
                  <button 
                    onClick={() => setContent(`# 教程：如何...

## 前言
为什么需要学习这个？

## 准备工作
- 工具A
- 工具B
- 基础知识

## 步骤一：xxx
详细步骤说明...

## 步骤二：xxx
详细步骤说明...

## 总结
**重点回顾**：
- 要点1
- 要点2

> 希望这个教程对你有帮助！`)}
                    className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">教程模板</div>
                    <div className="text-sm text-gray-500">适合写教程和指南</div>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  统计信息
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">字数统计</span>
                    <span className="font-medium">{content.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">段落数</span>
                    <span className="font-medium">{content.split('\n\n').filter(p => p.trim()).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">预计阅读</span>
                    <span className="font-medium">{Math.ceil(content.length / 400)}分钟</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <Heart className="w-5 h-5 text-red-500 mr-2" />
                  <span className="font-medium text-gray-900">使用提示</span>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 标题使用#符号</li>
                  <li>• **文字**表示重点</li>
                  <li>• >开头表示引用</li>
                  <li>• 段落间空行排版更美观</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeChatEditor;
