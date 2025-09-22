export class MenuManager {
    // 状态变量
    private currentInputType: 'file' | 'folder' | null = null; // 当前输入类型
    private currentInputContainer: HTMLElement | null = null; // 当前输入容器
    private currentInputElement: HTMLInputElement | null = null; // 当前输入元素
    private selectedFolderPath: string | null = null; // 选中的文件夹路径
    private selectedFolderElement: HTMLElement | null = null; // 选中的文件夹元素
    private isRefreshing: boolean = false; // 是否正在刷新

    // 文件树状态管理
    private currentExplorerRoot: string | null = null; // 当前资源管理器根目录
    private expandedFolders = new Set<string>(); // 已展开的文件夹集合
    private folderStructure = new Map<string, any>(); // 文件夹结构缓存
    private projectRootPath: string | null = null; // 项目根路径

    // 获取DOM元素的函数
    private getExplorerElements() {
        return {
            explorerTrigger: document.getElementById('explorer') as HTMLElement,
            explorerPanel: document.getElementById('explorer-panel') as HTMLElement,
            contentArea: document.querySelector('.content') as HTMLElement,
            explorerResizeHandle: document.getElementById('explorer-resize-handle') as HTMLElement,
            newFileBtn: document.getElementById('new-file-btn') as HTMLElement,
            newFolderBtn: document.getElementById('new-folder-btn') as HTMLElement,
            explorerContent: document.querySelector('.explorer-content') as HTMLElement
        };
    }

    // 根据路径查找对应的DOM元素
    private findElementByPath(path: string): HTMLElement | null {
        let element = document.querySelector(`[data-path="${path}"]`) as HTMLElement;
        
        if (!element) {
            const escapedPath = path.replace(/\\/g, '\\\\');
            element = document.querySelector(`[data-path="${escapedPath}"]`) as HTMLElement;
        }
        
        if (!element) {
            const allElements = document.querySelectorAll('[data-path]');
            for (const el of allElements) {
                const elementPath = el.getAttribute('data-path');
                if (elementPath === path) {
                    element = el as HTMLElement;
                    break;
                }
            }
        }
        
        return element;
    }

    // 延迟恢复文件夹选择状态
    private restoreSelectionAfterDelay(currentSelected: string | null, delay: number = 500): void {
        if (currentSelected) {
            setTimeout(() => {
                this.setSelectedFolder(currentSelected);
                this.isRefreshing = false;
            }, delay);
        } else {
            this.isRefreshing = false;
        }
    }

    // 包装异步操作，设置刷新标志
    private withRefreshingFlag<T>(operation: () => Promise<T>): Promise<T> {
        this.isRefreshing = true;
        return operation().finally(() => {
            this.isRefreshing = false;
        });
    }

    // 设置选中的文件夹
    private setSelectedFolder(folderPath: string, element?: HTMLElement): void {
        if (this.selectedFolderElement) {
            this.selectedFolderElement.classList.remove('selected');
        }
        
        this.selectedFolderPath = folderPath;
        this.selectedFolderElement = element || this.findElementByPath(folderPath);
        
        if (this.selectedFolderElement) {
            this.selectedFolderElement.classList.add('selected');
        }
    }

    private clearFolderSelection(): void {
        if (this.isRefreshing) {
            return;
        }
        
        if (this.selectedFolderElement) {
            this.selectedFolderElement.classList.remove('selected');
        }
        this.selectedFolderPath = null;
        this.selectedFolderElement = null;
    }

    // 创建内联输入框用于新建文件或文件夹
    private createInlineInput(type: 'file' | 'folder'): void {
        if (this.currentInputElement && this.currentInputElement.value.trim()) {
            this.currentInputElement.focus();
            this.currentInputElement.select();
            return;
        }
        
        this.removeInlineInput();
        
        // 根据选中的文件夹动态调整输入框位置
        let targetFolderElement: HTMLElement | null = null;
        
        if (this.selectedFolderPath && this.selectedFolderElement) {
            // 如果有选中的子文件夹，使用选中的子文件夹
            targetFolderElement = this.selectedFolderElement;
        } else {
            // 如果没有选中子文件夹，使用主文件夹
            targetFolderElement = document.querySelector('[data-level="0"]') as HTMLElement;
        }
        
        this.currentInputType = type;
    
        const container = document.createElement('div');
        container.className = 'inline-input-container';
        
        const icon = document.createElement('span');
        icon.className = 'file-icon';
        icon.textContent = type === 'file' ? '📄' : '📁';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'inline-input';
        input.placeholder = type === 'file' ? '文件名' : '文件夹名';
        input.autocomplete = 'off';
        input.spellcheck = false;
        
        container.appendChild(icon);
        container.appendChild(input);
        
        if (targetFolderElement) {
            // 确保目标文件夹是展开的
            const targetFolderPath = targetFolderElement.getAttribute('data-path');
            if (targetFolderPath && !this.expandedFolders.has(targetFolderPath)) {
                this.expandedFolders.add(targetFolderPath);
                const arrow = targetFolderElement.querySelector('span') as HTMLElement;
                if (arrow) {
                    arrow.textContent = '▼';
                }
            }
            
            const parent = targetFolderElement.parentElement;
            if (parent) {
                // 将输入框插入到目标文件夹的下一个位置
                const nextSibling = targetFolderElement.nextElementSibling;
                if (nextSibling) {
                    parent.insertBefore(container, nextSibling);
                } else {
                    parent.appendChild(container);
                }
            }
            
            // 设置输入框的缩进级别（目标文件夹的子级）
            const targetLevel = parseInt(targetFolderElement.getAttribute('data-level') || '0');
            const inputLevel = targetLevel + 1;
            container.style.paddingLeft = (4 + inputLevel * 16) + 'px';
        } else {
            // 如果找不到目标文件夹元素，回退到原来的逻辑
            const sections = (window as any).ensureSections ? (window as any).ensureSections() : null;
            if (sections && sections.folderSection) {
                sections.folderSection.insertBefore(container, sections.folderSection.firstChild);
            }
        }
        
        this.currentInputContainer = container;
        this.currentInputElement = input;
        
        setTimeout(() => {
            input.focus();
            input.select();
        }, 50);
        
        input.addEventListener('keydown', (e) => this.handleInputKeydown(e));
        input.addEventListener('blur', () => this.handleInputBlur());
    }

    private removeInlineInput(): void {
        if (this.currentInputContainer) {
            this.currentInputContainer.remove();
            this.currentInputContainer = null;
            this.currentInputElement = null;
            this.currentInputType = null;
        }
    }

    private async handleInputKeydown(e: KeyboardEvent): Promise<void> {
        if (e.key === 'Enter') {
            e.preventDefault();
            const name = this.currentInputElement?.value.trim();
            if (name) {
                await this.createItem(name);
                setTimeout(() => {
                    this.removeInlineInput();
                }, 200);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            this.removeInlineInput();
        }
    }

    private async handleInputBlur(): Promise<void> {
        setTimeout(async () => {
            if (this.currentInputElement) {
                const name = this.currentInputElement.value.trim();
                if (name) {
                    await this.createItem(name);
                    setTimeout(() => {
                        this.removeInlineInput();
                    }, 200);
                } else {
                    this.removeInlineInput();
                }
            }
        }, 100);
    }

    // 创建文件或文件夹
    private async createItem(name: string): Promise<void> {
        if (!this.currentInputType || !name.trim()) return;
        
        try {
            this.isRefreshing = true;
            
            // 如果有选中的子文件夹，则在子文件夹中创建；否则在主文件夹中创建
            const menuAPI = (window as any).menuAPI;
            if (!menuAPI) {
                throw new Error('Menu API not available');
            }
            
            const targetDir = this.selectedFolderPath || this.projectRootPath || await menuAPI.getProjectRoot();
            let created: string;
            
            if (this.currentInputType === 'file') {
                created = await menuAPI.createFile(name.trim(), targetDir);
            } else {
                created = await menuAPI.createFolder(name.trim(), targetDir);
            }
            
            setTimeout(() => {
                this.refreshSpecificFolder(targetDir);
            }, 200);
            
        } catch(err) {
            console.error(`创建${this.currentInputType === 'file' ? '文件' : '文件夹'}失败:`, err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            alert(`创建${this.currentInputType === 'file' ? '文件' : '文件夹'}失败: ${errorMessage}`);
            this.isRefreshing = false;
        }
    }


    // 创建文件树项目元素
    private createTreeItem(item: any, level: number = 0): HTMLElement {
        const row = document.createElement('div');
        row.className = 'tree-item';
        row.style.paddingLeft = (4 + level * 16) + 'px';
        row.setAttribute('data-level', level.toString());
        row.setAttribute('data-path', item.path);

        if (item.type === 'dir') {
            // 文件夹显示箭头
            const arrow = document.createElement('span');
            arrow.className = 'tree-arrow';
            
            const isExpanded = this.expandedFolders.has(item.path);
            arrow.textContent = isExpanded ? '▼' : '▶';
            arrow.onclick = async (e: Event) => {
                e.stopPropagation();
                await this.toggleFolder(item.path, row, level);
            };
            row.appendChild(arrow);
        } else {
            // 文件显示图标
            const icon = document.createElement('span');
            const iconClass = item.fileType ? item.fileType.iconclass : 'icon-txt';
            const iconColor = item.fileType ? item.fileType.color : '#666666';
            const iconSize = item.fileType ? item.fileType.size : 'normal';
            
            icon.className = `tree-icon iconfont ${iconClass}`;
            icon.style.color = iconColor;
            
            // 根据 size 属性设置图标大小
            if (iconSize === 'small') {
                icon.style.fontSize = '10px';
                icon.style.width = '12px';
                icon.style.height = '12px';
            } else if (iconSize === 'large') {
                icon.style.fontSize = '18px';
                icon.style.width = '20px';
                icon.style.height = '20px';
            }
            // normal 使用默认大小，不需要设置
            
            row.appendChild(icon);
        }

        const name = document.createElement('span');
        name.id='file-name';
        name.textContent = item.name;
        name.className = 'tree-name';
        row.appendChild(name);

        // 添加鼠标悬停事件来动态改变id
        row.addEventListener('mouseenter', () => {
            if (item.type === 'file') {
                name.id = 'file-editor';
            }
        });

        row.addEventListener('mouseleave', () => {
            if (item.type === 'file') {
                name.id = 'file-name';
            }
        });

        row.addEventListener('click', async (e: MouseEvent) => {
            e.stopPropagation();
            if (item.type === 'dir') {
                if (e.ctrlKey || e.metaKey) {
                    this.setSelectedFolder(item.path, row);
                } else {
                    this.setSelectedFolder(item.path, row);
                    await this.toggleFolder(item.path, row, level);
                }
            } else {
                window.dispatchEvent(new CustomEvent('addOpenedFile', { detail: { filePath: item.path } }));
                this.clearFolderSelection();
            }
        });

        return row;
    }

    // 切换文件夹展开/折叠状态
    private async toggleFolder(folderPath: string, row: HTMLElement, level: number): Promise<void> {
        const isExpanded = this.expandedFolders.has(folderPath);
        const arrow = row.querySelector('span') as HTMLElement;
        
        if (isExpanded) {
            this.expandedFolders.delete(folderPath);
            arrow.textContent = '▶';
            
            let nextSibling = row.nextElementSibling;
            while (nextSibling) {
                const nextLevel = parseInt((nextSibling as HTMLElement).getAttribute('data-level') || '0');
                if (nextLevel <= level) {
                    break;
                }
                
                const childPath = (nextSibling as HTMLElement).getAttribute('data-path');
                if (childPath) {
                    this.expandedFolders.delete(childPath);
                }
                
                const toRemove = nextSibling;
                nextSibling = nextSibling.nextElementSibling;
                toRemove.remove();
            }
        } else {
            this.expandedFolders.add(folderPath);
            arrow.textContent = '▼';
            
            try {
                const menuAPI = (window as any).menuAPI;
                if (!menuAPI) {
                    throw new Error('Menu API not available');
                }
                const items = await menuAPI.listDirectory(folderPath);
                const parent = row.parentElement;
                if (parent) {
                    const insertIndex = Array.from(parent.children).indexOf(row) + 1;
                    
                    items.forEach((item: any) => {
                        const childRow = this.createTreeItem(item, level + 1);
                        parent.insertBefore(childRow, parent.children[insertIndex]);
                    });
                }
            } catch (err) {
                console.error('Failed to load folder contents:', err);
            }
        }
    }

    private async refreshSpecificFolder(folderPath: string): Promise<void> {
        try {
            const currentSelected = this.selectedFolderPath;
            const folderElement = this.findElementByPath(folderPath);
            
            if (folderElement) {
                const level = parseInt(folderElement.getAttribute('data-level') || '0');
                if (this.expandedFolders.has(folderPath)) {
                    await this.refreshFolderContents(folderPath, folderElement, level);
                }
            } else {
                await this.refreshRootLevel();
            }
            
            this.restoreSelectionAfterDelay(currentSelected);
        } catch (err) {
            console.error('Failed to refresh specific folder:', err);
            this.isRefreshing = false;
        }
    }

    private async refreshFolderTree(): Promise<void> {
        const currentExpanded = new Set(this.expandedFolders);
        const currentSelected = this.selectedFolderPath;
        
        await this.refreshRootLevel();
        
        for (const path of currentExpanded) {
            const element = document.querySelector(`[data-path="${path}"]`) as HTMLElement;
            if (element) {
                const level = parseInt(element.getAttribute('data-level') || '0');
                await this.refreshFolderContents(path, element, level);
            }
        }
        
        if (currentSelected) {
            const element = document.querySelector(`[data-path="${currentSelected}"]`) as HTMLElement;
            if (element) {
                this.setSelectedFolder(currentSelected, element);
            }
        }
    }

    private async refreshRootLevel(): Promise<void> {
        const sections = (window as any).ensureSections ? (window as any).ensureSections() : null;
        if (!sections) return;
        const { folderSection } = sections;
        
        try {
            const currentSelected = this.selectedFolderPath;
            
            if (!this.projectRootPath) {
                const menuAPI = (window as any).menuAPI;
                if (menuAPI) {
                    this.projectRootPath = await menuAPI.getProjectRoot();
                }
            }
            
            const rootElement = folderSection.querySelector('[data-level="0"]') as HTMLElement;
            if (rootElement) {
                const rootPath = rootElement.getAttribute('data-path');
                if (rootPath) {
                    await this.refreshFolderContents(rootPath, rootElement, 0);
                }
            }
            
            if (currentSelected) {
                setTimeout(() => {
                    const element = this.findElementByPath(currentSelected);
                    if (element) {
                        this.setSelectedFolder(currentSelected, element);
                    }
                }, 100);
            }
        } catch(err) { 
            console.error('Refresh root level failed:', err); 
        }
    }

    private async refreshFolderContents(folderPath: string, folderElement: HTMLElement, level: number): Promise<void> {
        return this.withRefreshingFlag(async () => {
            const currentSelected = this.selectedFolderPath;
            const menuAPI = (window as any).menuAPI;
            if (!menuAPI) {
                throw new Error('Menu API not available');
            }
            const items = await menuAPI.listDirectory(folderPath);
            const parent = folderElement.parentElement;
            
            if (!parent) return;
            
            const expandedChildFolders = new Map<string, number>();
            let nextSibling = folderElement.nextElementSibling;
            while (nextSibling) {
                const nextLevel = parseInt((nextSibling as HTMLElement).getAttribute('data-level') || '0');
                if (nextLevel <= level) break;
                
                const childPath = (nextSibling as HTMLElement).getAttribute('data-path');
                if (childPath && this.expandedFolders.has(childPath)) {
                    expandedChildFolders.set(childPath, nextLevel);
                }
                
                const toRemove = nextSibling;
                nextSibling = nextSibling.nextElementSibling;
                toRemove.remove();
            }
            
            if (this.expandedFolders.has(folderPath)) {
                const insertIndex = Array.from(parent.children).indexOf(folderElement) + 1;
                
                items.forEach((item: any) => {
                    const childRow = this.createTreeItem(item, level + 1);
                    parent.insertBefore(childRow, parent.children[insertIndex]);
                    
                    if (item.type === 'dir' && expandedChildFolders.has(item.path)) {
                        setTimeout(async () => {
                            await this.expandFolderDirectlyWithChildren(item.path, childRow, level + 1);
                        }, 10);
                    }
                });
            }
            
            this.restoreSelectionAfterDelay(currentSelected);
        }).catch(err => {
            console.error('Failed to refresh folder contents:', err);
        });
    }

    private async expandFolderDirectlyWithChildren(folderPath: string, row: HTMLElement, level: number): Promise<void> {
        return this.withRefreshingFlag(async () => {
            const currentSelected = this.selectedFolderPath;
            this.expandedFolders.add(folderPath);
            
            const arrow = row.querySelector('span') as HTMLElement;
            if (arrow) {
                arrow.textContent = '▼';
            }
            
            const menuAPI = (window as any).menuAPI;
            if (!menuAPI) {
                throw new Error('Menu API not available');
            }
            const items = await menuAPI.listDirectory(folderPath);
            const parent = row.parentElement;
            
            if (parent) {
                const insertIndex = Array.from(parent.children).indexOf(row) + 1;
                
                items.forEach((item: any) => {
                    const childRow = this.createTreeItem(item, level + 1);
                    parent.insertBefore(childRow, parent.children[insertIndex]);
                    
                    if (item.type === 'dir' && this.expandedFolders.has(item.path)) {
                        setTimeout(async () => {
                            await this.expandFolderDirectlyWithChildren(item.path, childRow, level + 1);
                        }, 10);
                    }
                });
            }
            
            this.restoreSelectionAfterDelay(currentSelected);
        }).catch(err => {
            console.error('Failed to expand folder with children:', err);
        });
    }

    private async expandFolderDirectly(folderPath: string, row: HTMLElement, level: number): Promise<void> {
        try {
            this.expandedFolders.add(folderPath);
            
            const arrow = row.querySelector('span') as HTMLElement;
            if (arrow) {
                arrow.textContent = '▼';
            }
            
            const menuAPI = (window as any).menuAPI;
            if (!menuAPI) {
                throw new Error('Menu API not available');
            }
            const items = await menuAPI.listDirectory(folderPath);
            
            const parent = row.parentElement;
            if (parent) {
                const insertIndex = Array.from(parent.children).indexOf(row) + 1;
                
                items.forEach((item: any) => {
                    const childRow = this.createTreeItem(item, level + 1);
                    parent.insertBefore(childRow, parent.children[insertIndex]);
                });
            }
        } catch (err) {
            console.error('Failed to expand folder directly:', err);
        }
    }

    // 自动展开项目文件夹
    private async expandProjectFolder(): Promise<void> {
        try {
            // 确保项目根目录已渲染
            if (!this.projectRootPath) {
                const menuAPI = (window as any).menuAPI;
                if (menuAPI) {
                    this.projectRootPath = await menuAPI.getProjectRoot();
                }
            }
            
            // 查找主文件夹元素
            const mainFolderElement = document.querySelector('[data-level="0"]') as HTMLElement;
            if (mainFolderElement) {
                const mainFolderPath = mainFolderElement.getAttribute('data-path');
                if (mainFolderPath && !this.expandedFolders.has(mainFolderPath)) {
                    // 展开主文件夹
                    const level = parseInt(mainFolderElement.getAttribute('data-level') || '0');
                    await this.expandFolderDirectly(mainFolderPath, mainFolderElement, level);
                }
            }
        } catch (err) {
            console.error('Failed to expand project folder:', err);
        }
    }

    // 渲染项目根目录
    private async renderProjectRoot(): Promise<void> {
        const sections = (window as any).ensureSections ? (window as any).ensureSections() : null;
        if (!sections) {
            setTimeout(() => this.renderProjectRoot(), 100);
            return;
        }
        const { folderSection } = sections;
        
        try {
            if (!this.projectRootPath) {
                const menuAPI = (window as any).menuAPI;
                if (menuAPI) {
                    this.projectRootPath = await menuAPI.getProjectRoot();
                } else {
                    return;
                }
            }
            
            this.expandedFolders.clear();
            folderSection.innerHTML = '';
            
            const title = document.createElement('div');
            title.textContent = 'FOLDERS';
            title.className = 'section-title';
            folderSection.appendChild(title);

            const list = document.createElement('div');
            
            const menuAPI = (window as any).menuAPI;
            if (menuAPI) {
                const defaultProjectRoot = await menuAPI.getProjectRoot();
                const isCustomFolder = this.projectRootPath !== defaultProjectRoot;
                
                if (isCustomFolder) {
                    const folderName = this.projectRootPath?.split(/[/\\]/).pop() || 'Folder';
                    const rootItem = {
                        name: folderName,
                        type: 'dir',
                        path: this.projectRootPath
                    };
                    const row = this.createTreeItem(rootItem, 0);
                    list.appendChild(row);
                } else {
                    const rootItem = {
                        name: 'Desktop',
                        type: 'dir',
                        path: this.projectRootPath
                    };
                    const row = this.createTreeItem(rootItem, 0);
                    list.appendChild(row);
                }
            }
            
            folderSection.appendChild(list);
            this.currentExplorerRoot = 'PROJECT_ROOT';
        } catch(err) { 
            console.error('Render project root failed:', err); 
        }
    }

    // 初始化函数
    public initialize(): void {
        // 等待DOM元素可用
        const checkAndInit = () => {
            const elements = this.getExplorerElements();
            
            if (elements.explorerTrigger && elements.explorerPanel && elements.contentArea) {
                document.addEventListener('click', (e: Event) => {
                    const target = e.target as HTMLElement;
                    if (!target.closest('#folder-section') && !target.closest('.explorer-btn')) {
                        this.clearFolderSelection();
                    }
                });

                elements.explorerTrigger.addEventListener('click', (e: Event) => {
                    e.stopPropagation();
                    const isShowing = elements.explorerPanel.classList.toggle('show');
                
                if (isShowing) {
                    const aiPanel = document.getElementById('ai-panel') as HTMLElement;
                    if (aiPanel && aiPanel.classList.contains('show')) {
                        aiPanel.classList.remove('show');
                        elements.contentArea.classList.remove('shifted');
                        elements.contentArea.style.marginLeft = '60px';
                    }
                }
                
                elements.contentArea.classList.add('resizing');
                
                if (isShowing) {
                    elements.contentArea.classList.add('shifted');
                    const menuWidth = 50;
                    const panelWidth = elements.explorerPanel.getBoundingClientRect().width;
                    elements.contentArea.style.marginLeft = (menuWidth + panelWidth + 10) + 'px';
                    window.dispatchEvent(new CustomEvent('renderOpenedFiles'));
                    if (!elements.explorerContent.querySelector('#folder-section')) this.renderProjectRoot();
                } else {
                    elements.contentArea.classList.remove('shifted');
                    elements.contentArea.style.marginLeft = '60px';
                }
                
                // 同步调整终端位置
                if ((window as any).adjustTerminalPosition) {
                    (window as any).adjustTerminalPosition();
                }
                
                setTimeout(() => {
                    elements.contentArea.classList.remove('resizing');
                }, 100);
            });

            if (elements.explorerResizeHandle) {
                let isResizing: boolean = false;
                let startX: number = 0;
                let startWidth: number = 0;

                const minWidth = 180;

                elements.explorerResizeHandle.addEventListener('mousedown', function(e: MouseEvent) {
                    isResizing = true;
                    startX = e.clientX;
                    startWidth = elements.explorerPanel.getBoundingClientRect().width;
                    document.body.style.userSelect = 'none';
                    elements.contentArea.classList.add('resizing');
                });

                document.addEventListener('mousemove', function(e: MouseEvent) {
                    if (!isResizing) return;
                    const delta = e.clientX - startX;
                    let newWidth = startWidth + delta;
                    const maxWidth = Math.floor(window.innerWidth * 0.5);
                    if (newWidth < minWidth) newWidth = minWidth;
                    if (newWidth > maxWidth) newWidth = maxWidth;
                    elements.explorerPanel.style.width = newWidth + 'px';
                    const menuWidth = 50;
                    elements.contentArea.style.marginLeft = (menuWidth + newWidth + 10) + 'px';
                    
                    // 同步调整终端位置
                    if ((window as any).adjustTerminalPosition) {
                        (window as any).adjustTerminalPosition();
                    }
                });

                document.addEventListener('mouseup', function() {
                    if (!isResizing) return;
                    isResizing = false;
                    document.body.style.userSelect = '';
                    elements.contentArea.classList.remove('resizing');
                });

                // 窗口大小改变时自动调整Explorer面板宽度
                window.addEventListener('resize', function() {
                    if (elements.explorerPanel && elements.contentArea) {
                        const currentWidth = elements.explorerPanel.getBoundingClientRect().width;
                        const maxWidth = Math.floor(window.innerWidth * 0.5);
                        
                        // 如果当前宽度超过新的最大宽度，则缩小面板
                        if (currentWidth > maxWidth) {
                            // 禁用过渡效果以避免延迟
                            elements.contentArea.classList.add('resizing');
                            
                            elements.explorerPanel.style.width = maxWidth + 'px';
                            const menuWidth = 50;
                            elements.contentArea.style.marginLeft = (menuWidth + maxWidth + 10) + 'px';
                            
                            // 同步调整终端位置
                            if ((window as any).adjustTerminalPosition) {
                                (window as any).adjustTerminalPosition();
                            }
                            
                            // 短暂延迟后重新启用过渡效果
                            setTimeout(() => {
                                elements.contentArea.classList.remove('resizing');
                            }, 10);
                        }
                    }
                });
            }

            // 与 menu-handlers.ts 的通信事件监听器
            window.addEventListener('createInlineInput', (e: Event) => {
                const customEvent = e as CustomEvent;
                const { type } = customEvent.detail;
                this.createInlineInput(type);
            });

            window.addEventListener('clearFolderSelection', () => {
                this.clearFolderSelection();
            });

            window.addEventListener('renderProjectRoot', (e: Event) => {
                const customEvent = e as CustomEvent;
                const { projectRoot } = customEvent.detail;
                this.projectRootPath = projectRoot;
                this.renderProjectRoot();
            });

            window.addEventListener('expandProjectFolder', async () => {
                // 自动展开项目文件夹
                await this.expandProjectFolder();
            });
        } else {
            // 如果DOM元素还没准备好，等待一下再试
            setTimeout(checkAndInit, 10);
        }
    };
    
    checkAndInit();
    }
}

// 导出便捷函数
export function initializeMenu(): MenuManager {
    const menuManager = new MenuManager();
    menuManager.initialize();
    return menuManager;
}