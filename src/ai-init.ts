export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: number;
}

export class AIPanelManager {
    private aiTrigger: HTMLElement | null;
    private aiPanel: HTMLElement | null;
    private aiCloseBtn: HTMLElement | null;
    private aiResizeHandle: HTMLElement | null;
    private contentArea: HTMLElement | null;
    private explorerPanel: HTMLElement | null;
    private chatHistory: ChatMessage[] = [];
    private aiChatArea: HTMLElement | null;
    private aiMessageInput: HTMLTextAreaElement | null;
    private aiSendBtn: HTMLButtonElement | null;
    private aiClearBtn: HTMLElement | null;

    constructor() {
        this.aiTrigger = document.getElementById('ai-trigger') as HTMLElement;
        this.aiPanel = document.getElementById('ai-panel') as HTMLElement;
        this.aiCloseBtn = document.getElementById('ai-close-btn') as HTMLElement;
        this.aiResizeHandle = document.getElementById('ai-resize-handle') as HTMLElement;
        this.contentArea = document.querySelector('.content') as HTMLElement;
        this.explorerPanel = document.getElementById('explorer-panel') as HTMLElement;

        this.aiChatArea = document.getElementById('ai-chatArea') as HTMLElement;
        this.aiMessageInput = document.getElementById('ai-messageInput') as HTMLTextAreaElement;
        this.aiSendBtn = document.getElementById('ai-sendBtn') as HTMLButtonElement;
        this.aiClearBtn = document.getElementById('ai-clear-btn') as HTMLElement;
    }

    public initialize(): void {
        this.setupPanelHandlers();
        this.setupChatHandlers();
        this.setupMessageHandlers();
    }

    private setupPanelHandlers(): void {
        if (this.aiTrigger && this.aiPanel && this.contentArea) {
            this.aiTrigger.addEventListener('click', (e: Event) => {
                e.stopPropagation();
                const isShowing = this.aiPanel!.classList.toggle('show');
                
                if (isShowing && this.explorerPanel) {
                    this.explorerPanel.classList.remove('show');
                }
                
                this.contentArea!.classList.add('resizing');
                
                if (isShowing) {
                    this.contentArea!.classList.add('shifted');
                    const menuWidth = 50;
                    const panelWidth = this.aiPanel!.getBoundingClientRect().width;
                    const newMarginLeft = menuWidth + panelWidth + 10;
                    this.contentArea!.style.marginLeft = newMarginLeft + 'px';
                    
                    const editTermContainer = document.querySelector('.edit-term-container') as HTMLElement;
                    if (editTermContainer) {
                        editTermContainer.style.width = `calc(100% - ${newMarginLeft}px)`;
                    }
                } else {
                    this.contentArea!.classList.remove('shifted');
                    this.contentArea!.style.marginLeft = '60px';
                    
                    const editTermContainer = document.querySelector('.edit-term-container') as HTMLElement;
                    if (editTermContainer) {
                        editTermContainer.style.width = 'calc(100% - 60px)';
                    }
                }
                
                if ((window as any).adjustTerminalPosition) {
                    (window as any).adjustTerminalPosition();
                }
                
                setTimeout(() => {
                    this.contentArea!.classList.remove('resizing');
                }, 100);
            });
        }

        if (this.aiCloseBtn && this.aiPanel && this.contentArea) {
            this.aiCloseBtn.addEventListener('click', (e: Event) => {
                e.stopPropagation();
                
                this.contentArea!.classList.add('resizing');
                
                this.aiPanel!.classList.remove('show');
                this.contentArea!.classList.remove('shifted');
                this.contentArea!.style.marginLeft = '60px';
                
                const editTermContainer = document.querySelector('.edit-term-container') as HTMLElement;
                if (editTermContainer) {
                    editTermContainer.style.width = 'calc(100% - 64px)';
                }
                
                if ((window as any).adjustTerminalPosition) {
                    (window as any).adjustTerminalPosition();
                }
                
                setTimeout(() => {
                    this.contentArea!.classList.remove('resizing');
                }, 100);
            });
        }

        this.setupResizeHandlers();
    }

    private setupResizeHandlers(): void {
        if (!this.aiResizeHandle || !this.aiPanel || !this.contentArea) return;

        let isAiResizing: boolean = false;
        let aiStartX: number = 0;
        let aiStartWidth: number = 0;

        const aiMinWidth = 180;

        this.aiResizeHandle.addEventListener('mousedown', (e: MouseEvent) => {
            isAiResizing = true;
            aiStartX = e.clientX;
            aiStartWidth = this.aiPanel!.getBoundingClientRect().width;
            document.body.style.userSelect = 'none';
            this.contentArea!.classList.add('resizing');
        });

        document.addEventListener('mousemove', (e: MouseEvent) => {
            if (!isAiResizing) return;
            const delta = e.clientX - aiStartX;
            let newWidth = aiStartWidth + delta;
            const aiMaxWidth = Math.floor(window.innerWidth * 0.5);
            if (newWidth < aiMinWidth) newWidth = aiMinWidth;
            if (newWidth > aiMaxWidth) newWidth = aiMaxWidth;
            this.aiPanel!.style.width = newWidth + 'px';
            const menuWidth = 50;
            const newMarginLeft = menuWidth + newWidth + 10;
            this.contentArea!.style.marginLeft = newMarginLeft + 'px';
            
            const editTermContainer = document.querySelector('.edit-term-container') as HTMLElement;
            if (editTermContainer) {
                editTermContainer.style.width = `calc(100% - ${newMarginLeft}px - 4px)`;
            }
            
            if ((window as any).adjustTerminalPosition) {
                (window as any).adjustTerminalPosition();
            }
        });

        document.addEventListener('mouseup', () => {
            if (!isAiResizing) return;
            isAiResizing = false;
            document.body.style.userSelect = '';
            this.contentArea!.classList.remove('resizing');
        });

        window.addEventListener('resize', () => {
            if (this.aiPanel && this.contentArea) {
                const currentWidth = this.aiPanel.getBoundingClientRect().width;
                const maxWidth = Math.floor(window.innerWidth * 0.5);
                
                if (currentWidth > maxWidth) {
                    this.contentArea.classList.add('resizing');
                    
                    this.aiPanel.style.width = maxWidth + 'px';
                    const menuWidth = 50;
                    const newMarginLeft = menuWidth + maxWidth + 10;
                    this.contentArea.style.marginLeft = newMarginLeft + 'px';
                    
                    const editTermContainer = document.querySelector('.edit-term-container') as HTMLElement;
                    if (editTermContainer) {
                        editTermContainer.style.width = `calc(100% - ${newMarginLeft}px)`;
                    }
                    
                    if ((window as any).adjustTerminalPosition) {
                        (window as any).adjustTerminalPosition();
                    }
                    
                    setTimeout(() => {
                        this.contentArea!.classList.remove('resizing');
                    }, 10);
                }
            }
        });
    }

    private setupChatHandlers(): void {
        if (this.aiSendBtn) {
            this.aiSendBtn.addEventListener('click', () => this.sendAIMessage());
        }

        if (this.aiMessageInput) {
            this.aiMessageInput.addEventListener('keydown', (e: KeyboardEvent) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendAIMessage();
                }
            });
        }

        if (this.aiClearBtn && this.aiChatArea) {
            this.aiClearBtn.addEventListener('click', (e: Event) => {
                e.stopPropagation();
                this.clearChatHistory();
            });
        }
    }

    private setupMessageHandlers(): void {
        window.addEventListener('message', async (event) => {
            if (event.data.type === 'ai-request') {
                try {
                    const response = await (window as any).aiAPI.chat(event.data.message);
                    (event.source as Window).postMessage({
                        type: 'ai-response',
                        id: event.data.id,
                        response: response
                    }, '*');
                } catch (error) {
                    console.error('AI service error:', error);
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    (event.source as Window).postMessage({
                        type: 'ai-response',
                        id: event.data.id,
                        error: errorMessage
                    }, '*');
                }
            }
        });
    }

    private formatMessageContent(content: string): string {
        let html = content;
        
        html = html.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');
        
        html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang ? ` class="language-${lang}"` : '';
            return `<pre><code${language}>${code.trim()}</code></pre>`;
        });
        
        html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');
        
        html = html.replace(/^#{6}\s+(.*$)/gm, '<h6>$1</h6>');
        html = html.replace(/^#{5}\s+(.*$)/gm, '<h5>$1</h5>');
        html = html.replace(/^#{4}\s+(.*$)/gm, '<h4>$1</h4>');
        html = html.replace(/^#{3}\s+(.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^#{2}\s+(.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^#{1}\s+(.*$)/gm, '<h1>$1</h1>');
        
        html = html.replace(/^[-*_]{3,}$/gm, '<hr>');
        
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
        
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
        
        html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
        
        html = html.replace(/\[([^\]]+)\]\(([^)]+)(?:\s+"([^"]*)")?\)/g, (match, text, url, title) => {
            const titleAttr = title ? ` title="${title}"` : '';
            return `<a href="${url}" target="_blank"${titleAttr}>${text}</a>`;
        });
        
        html = html.replace(/(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g, '<a href="$1" target="_blank">$1</a>');
        
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)(?:\s+"([^"]*)")?\)/g, (match, alt, src, title) => {
            const titleAttr = title ? ` title="${title}"` : '';
            return `<img src="${src}" alt="${alt}"${titleAttr} style="max-width: 100%; height: auto;">`;
        });
        
        html = html.replace(/^>\s*(.*$)/gm, '<blockquote>$1</blockquote>');
        
        html = html.replace(/^[\s]*[-*+]\s+(.*$)/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        html = html.replace(/^[\s]*\d+\.\s+(.*$)/gm, '<li>$1</li>');
        
        html = html.replace(/\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)*)/g, (match, header, rows) => {
            const headerCells = header.split('|').map((cell: string) => `<th>${cell.trim()}</th>`).join('');
            const rowLines = rows.trim().split('\n');
            const tableRows = rowLines.map((row: string) => {
                const cells = row.split('|').map((cell: string) => `<td>${cell.trim()}</td>`).join('');
                return `<tr>${cells}</tr>`;
            }).join('');
            return `<table><thead><tr>${headerCells}</tr></thead><tbody>${tableRows}</tbody></table>`;
        });
        
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');
        
        if (!html.startsWith('<')) {
            html = '<p>' + html + '</p>';
        }
        
        return html;
    }

    private addAIMessage(content: string, isUser: boolean = false): void {
        if (!this.aiChatArea) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = isUser ? 'user-message' : 'ai-message';
        
        if (isUser) {
            messageDiv.textContent = content;
        } else {
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

    private createStreamingAIMessage(): HTMLElement | null {
        if (!this.aiChatArea) return null;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'ai-message streaming';
        messageDiv.innerHTML = '<p></p>';
        this.aiChatArea.appendChild(messageDiv);
        this.aiChatArea.scrollTop = this.aiChatArea.scrollHeight;
        return messageDiv;
    }

    private updateStreamingMessage(messageDiv: HTMLElement, content: string): void {
        if (!messageDiv) return;
        messageDiv.innerHTML = this.formatMessageContent(content);
        if (this.aiChatArea) {
            this.aiChatArea.scrollTop = this.aiChatArea.scrollHeight;
        }
    }

    private async sendAIMessage(): Promise<void> {
        if (!this.aiMessageInput || !this.aiSendBtn) return;
        
        const message = this.aiMessageInput.value.trim();
        if (!message) return;
        
        this.addAIMessage(message, true);
        this.aiMessageInput.value = '';
        this.aiSendBtn.disabled = true;
        this.aiSendBtn.textContent = 'Sending...';
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'ai-message loading';
        loadingDiv.textContent = 'AI is thinking...';
        this.aiChatArea!.appendChild(loadingDiv);
        this.aiChatArea!.scrollTop = this.aiChatArea!.scrollHeight;
        
        try {
            loadingDiv.remove();
            
            const streamingMessageDiv = this.createStreamingAIMessage();
            let fullResponse = '';
            
                    const aiAPI = (window as any).aiAPI;
            
            const serializableHistory = this.chatHistory.map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp
            }));
            
            if (aiAPI && aiAPI.chatStream) {
                const response = await aiAPI.chatStream(message, serializableHistory);
                fullResponse = response;
                
                const words = fullResponse.split('');
                let currentText = '';
                for (let i = 0; i < words.length; i++) {
                    currentText += words[i];
                    this.updateStreamingMessage(streamingMessageDiv!, currentText);
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            } else {
                const response = await aiAPI.chat(message, serializableHistory);
                fullResponse = response;
                this.updateStreamingMessage(streamingMessageDiv!, fullResponse);
            }
            
            if (streamingMessageDiv) {
                streamingMessageDiv.classList.remove('streaming');
            }
            
        } catch (error) {
            loadingDiv.remove();
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.addAIMessage('AI service error: ' + errorMessage);
        } finally {
            this.aiSendBtn.disabled = false;
            this.aiSendBtn.textContent = 'Send';
            this.aiMessageInput.focus();
        }
    }

    private clearChatHistory(): void {
        this.chatHistory = [];
        
        if (this.aiChatArea) {
            this.aiChatArea.innerHTML = `
                <div class="ai-message">
                    Hello! I am the AI Assistant. How can I assist you today?
                </div>
            `;
            this.aiChatArea.scrollTop = 0;
        }
    }

    public getChatHistory(): ChatMessage[] {
        return [...this.chatHistory];
    }

    public setChatHistory(history: ChatMessage[]): void {
        this.chatHistory = [...history];
    }

}

export function initializeAIPanel(): AIPanelManager {
    const aiPanelManager = new AIPanelManager();
    aiPanelManager.initialize();
    return aiPanelManager;
}