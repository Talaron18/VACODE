"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIPanelManager = void 0;
exports.initializeAIPanel = initializeAIPanel;
class AIPanelManager {
    constructor() {
        this.chatHistory = [];
        this.aiTrigger = document.getElementById('ai-trigger');
        this.aiPanel = document.getElementById('ai-panel');
        this.aiCloseBtn = document.getElementById('ai-close-btn');
        this.aiResizeHandle = document.getElementById('ai-resize-handle');
        this.contentArea = document.querySelector('.content');
        this.explorerPanel = document.getElementById('explorer-panel');
        // AI 聊天相关DOM元素
        this.aiChatArea = document.getElementById('ai-chatArea');
        this.aiMessageInput = document.getElementById('ai-messageInput');
        this.aiSendBtn = document.getElementById('ai-sendBtn');
        this.aiClearBtn = document.getElementById('ai-clear-btn');
    }
    initialize() {
        this.setupPanelHandlers();
        this.setupChatHandlers();
        this.setupMessageHandlers();
    }
    setupPanelHandlers() {
        // AI 面板显示/隐藏
        if (this.aiTrigger && this.aiPanel && this.contentArea) {
            this.aiTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const isShowing = this.aiPanel.classList.toggle('show');
                if (isShowing && this.explorerPanel) {
                    this.explorerPanel.classList.remove('show');
                }
                this.contentArea.classList.add('resizing');
                if (isShowing) {
                    this.contentArea.classList.add('shifted');
                    const menuWidth = 50;
                    const panelWidth = this.aiPanel.getBoundingClientRect().width;
                    this.contentArea.style.marginLeft = (menuWidth + panelWidth + 10) + 'px';
                }
                else {
                    this.contentArea.classList.remove('shifted');
                    this.contentArea.style.marginLeft = '60px';
                }
                setTimeout(() => {
                    this.contentArea.classList.remove('resizing');
                }, 100);
            });
        }
        // AI 面板关闭按钮
        if (this.aiCloseBtn && this.aiPanel && this.contentArea) {
            this.aiCloseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.contentArea.classList.add('resizing');
                this.aiPanel.classList.remove('show');
                this.contentArea.classList.remove('shifted');
                this.contentArea.style.marginLeft = '60px';
                setTimeout(() => {
                    this.contentArea.classList.remove('resizing');
                }, 100);
            });
        }
        // AI 面板大小调整
        this.setupResizeHandlers();
    }
    setupResizeHandlers() {
        if (!this.aiResizeHandle || !this.aiPanel || !this.contentArea)
            return;
        let isAiResizing = false;
        let aiStartX = 0;
        let aiStartWidth = 0;
        const aiMinWidth = 180;
        const aiMaxWidth = 560;
        this.aiResizeHandle.addEventListener('mousedown', (e) => {
            isAiResizing = true;
            aiStartX = e.clientX;
            aiStartWidth = this.aiPanel.getBoundingClientRect().width;
            document.body.style.userSelect = 'none';
            this.contentArea.classList.add('resizing');
        });
        document.addEventListener('mousemove', (e) => {
            if (!isAiResizing)
                return;
            const delta = e.clientX - aiStartX;
            let newWidth = aiStartWidth + delta;
            if (newWidth < aiMinWidth)
                newWidth = aiMinWidth;
            if (newWidth > aiMaxWidth)
                newWidth = aiMaxWidth;
            this.aiPanel.style.width = newWidth + 'px';
            const menuWidth = 50;
            this.contentArea.style.marginLeft = (menuWidth + newWidth + 10) + 'px';
        });
        document.addEventListener('mouseup', () => {
            if (!isAiResizing)
                return;
            isAiResizing = false;
            document.body.style.userSelect = '';
            this.contentArea.classList.remove('resizing');
        });
    }
    setupChatHandlers() {
        if (this.aiSendBtn) {
            this.aiSendBtn.addEventListener('click', () => this.sendAIMessage());
        }
        if (this.aiMessageInput) {
            this.aiMessageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendAIMessage();
                }
            });
        }
        if (this.aiClearBtn && this.aiChatArea) {
            this.aiClearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearChatHistory();
            });
        }
    }
    setupMessageHandlers() {
        window.addEventListener('message', async (event) => {
            if (event.data.type === 'ai-request') {
                try {
                    const response = await window.aiAPI.chat(event.data.message);
                    event.source.postMessage({
                        type: 'ai-response',
                        id: event.data.id,
                        response: response
                    }, '*');
                }
                catch (error) {
                    console.error('AI服务错误:', error);
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    event.source.postMessage({
                        type: 'ai-response',
                        id: event.data.id,
                        error: errorMessage
                    }, '*');
                }
            }
        });
    }
    // 自定义 Markdown 渲染器
    formatMessageContent(content) {
        let html = content;
        // 转义 HTML 特殊字符
        html = html.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        // 代码块 (``` 包围，支持语言标识)
        html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang ? ` class="language-${lang}"` : '';
            return `<pre><code${language}>${code.trim()}</code></pre>`;
        });
        // 行内代码 (` 包围)
        html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');
        // 标题 (支持 1-6 级)
        html = html.replace(/^#{6}\s+(.*$)/gm, '<h6>$1</h6>');
        html = html.replace(/^#{5}\s+(.*$)/gm, '<h5>$1</h5>');
        html = html.replace(/^#{4}\s+(.*$)/gm, '<h4>$1</h4>');
        html = html.replace(/^#{3}\s+(.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^#{2}\s+(.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^#{1}\s+(.*$)/gm, '<h1>$1</h1>');
        // 水平分割线
        html = html.replace(/^[-*_]{3,}$/gm, '<hr>');
        // 粗体 (** 或 __ 包围)
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
        // 斜体 (* 或 _ 包围)
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
        // 删除线 (~~ 包围)
        html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
        // 链接 ([文本](URL "标题"))
        html = html.replace(/\[([^\]]+)\]\(([^)]+)(?:\s+"([^"]*)")?\)/g, (match, text, url, title) => {
            const titleAttr = title ? ` title="${title}"` : '';
            return `<a href="${url}" target="_blank"${titleAttr}>${text}</a>`;
        });
        // 自动链接 (http/https/ftp)
        html = html.replace(/(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g, '<a href="$1" target="_blank">$1</a>');
        // 图片 (![alt](src "title"))
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)(?:\s+"([^"]*)")?\)/g, (match, alt, src, title) => {
            const titleAttr = title ? ` title="${title}"` : '';
            return `<img src="${src}" alt="${alt}"${titleAttr} style="max-width: 100%; height: auto;">`;
        });
        // 引用 (> 开头)
        html = html.replace(/^>\s*(.*$)/gm, '<blockquote>$1</blockquote>');
        // 无序列表 (- * + 开头)
        html = html.replace(/^[\s]*[-*+]\s+(.*$)/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        // 有序列表 (数字. 开头)
        html = html.replace(/^[\s]*\d+\.\s+(.*$)/gm, '<li>$1</li>');
        // 表格 (简单支持)
        html = html.replace(/\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)*)/g, (match, header, rows) => {
            const headerCells = header.split('|').map((cell) => `<th>${cell.trim()}</th>`).join('');
            const rowLines = rows.trim().split('\n');
            const tableRows = rowLines.map((row) => {
                const cells = row.split('|').map((cell) => `<td>${cell.trim()}</td>`).join('');
                return `<tr>${cells}</tr>`;
            }).join('');
            return `<table><thead><tr>${headerCells}</tr></thead><tbody>${tableRows}</tbody></table>`;
        });
        // 换行处理
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');
        // 包装段落
        if (!html.startsWith('<')) {
            html = '<p>' + html + '</p>';
        }
        return html;
    }
    // 添加AI消息到聊天区域
    addAIMessage(content, isUser = false) {
        if (!this.aiChatArea)
            return;
        const messageDiv = document.createElement('div');
        messageDiv.className = isUser ? 'user-message' : 'ai-message';
        if (isUser) {
            messageDiv.textContent = content;
        }
        else {
            messageDiv.innerHTML = this.formatMessageContent(content);
        }
        this.aiChatArea.appendChild(messageDiv);
        this.aiChatArea.scrollTop = this.aiChatArea.scrollHeight;
        this.chatHistory.push({
            role: isUser ? 'user' : 'assistant',
            content: content,
            timestamp: Date.now()
        });
    }
    createStreamingAIMessage() {
        if (!this.aiChatArea)
            return null;
        const messageDiv = document.createElement('div');
        messageDiv.className = 'ai-message streaming';
        messageDiv.innerHTML = '<p></p>';
        this.aiChatArea.appendChild(messageDiv);
        this.aiChatArea.scrollTop = this.aiChatArea.scrollHeight;
        return messageDiv;
    }
    updateStreamingMessage(messageDiv, content) {
        if (!messageDiv)
            return;
        messageDiv.innerHTML = this.formatMessageContent(content);
        if (this.aiChatArea) {
            this.aiChatArea.scrollTop = this.aiChatArea.scrollHeight;
        }
    }
    // 发送AI消息
    async sendAIMessage() {
        if (!this.aiMessageInput || !this.aiSendBtn)
            return;
        const message = this.aiMessageInput.value.trim();
        if (!message)
            return;
        this.addAIMessage(message, true);
        this.aiMessageInput.value = '';
        this.aiSendBtn.disabled = true;
        this.aiSendBtn.textContent = 'Sending...';
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'ai-message loading';
        loadingDiv.textContent = 'Client is processing your request...';
        this.aiChatArea.appendChild(loadingDiv);
        this.aiChatArea.scrollTop = this.aiChatArea.scrollHeight;
        try {
            loadingDiv.remove();
            const streamingMessageDiv = this.createStreamingAIMessage();
            let fullResponse = '';
            const aiAPI = window.aiAPI;
            // 确保只传递可序列化的数据
            const serializableHistory = this.chatHistory.map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp
            }));
            if (aiAPI && aiAPI.chatStream) {
                // 使用流式调用
                const response = await aiAPI.chatStream(message, serializableHistory);
                fullResponse = response;
                // 实现打字机效果
                const words = fullResponse.split('');
                let currentText = '';
                for (let i = 0; i < words.length; i++) {
                    currentText += words[i];
                    this.updateStreamingMessage(streamingMessageDiv, currentText);
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }
            else {
                // 降级到普通调用
                const response = await aiAPI.chat(message, serializableHistory);
                fullResponse = response;
                this.updateStreamingMessage(streamingMessageDiv, fullResponse);
            }
            if (streamingMessageDiv) {
                streamingMessageDiv.classList.remove('streaming');
            }
        }
        catch (error) {
            loadingDiv.remove();
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            this.addAIMessage('AI服务错误: ' + errorMessage);
        }
        finally {
            this.aiSendBtn.disabled = false;
            this.aiSendBtn.textContent = '发送';
            this.aiMessageInput.focus();
        }
    }
    clearChatHistory() {
        this.chatHistory = [];
        if (this.aiChatArea) {
            this.aiChatArea.innerHTML = `
                <div class="ai-message">
                    你好！我是AI助手，有什么可以帮助你的吗？
                </div>
            `;
            this.aiChatArea.scrollTop = 0;
        }
    }
    getChatHistory() {
        return [...this.chatHistory];
    }
    setChatHistory(history) {
        this.chatHistory = [...history];
    }
}
exports.AIPanelManager = AIPanelManager;
// 导出便捷函数
function initializeAIPanel() {
    const aiPanelManager = new AIPanelManager();
    aiPanelManager.initialize();
    return aiPanelManager;
}
//# sourceMappingURL=ai-init.js.map