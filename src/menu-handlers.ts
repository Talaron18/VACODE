export class MenuHandlersManager {
    private openedFiles: string[] = []; // 已打开的文件列表
    private projectRootPath: string | null = null; // 项目根路径
    private menuPositions: { [key: string]: { left: string } } = {
        'file-menu': { left: '12px' }
    };

    // 通过IPC获取文件类型信息，避免重复代码
    private async getFileIcon(filePath: string): Promise<string> {
        try {
            const menuAPI = (window as any).menuAPI;
            if (menuAPI) {
                const fileType = await menuAPI.getFileType(filePath);
                return fileType?.icon || '📄';
            }
            return '📄';
        } catch (error) {
            console.warn('Failed to get file type:', error);
            return '📄';
        }
    }

    // 获取DOM元素的函数
    private getMenuElements() {
        return {
            fileMenuTrigger: document.getElementById('title_file') as HTMLElement,
            editMenuTrigger: document.getElementById('title_edit') as HTMLElement,
            fileDropdown: document.getElementById('file-dropdown') as HTMLElement,
            editDropdown: document.getElementById('edit-dropdown') as HTMLElement,
            helpMenuTrigger: document.getElementById('title_help') as HTMLElement,
            helpDropdown: document.getElementById('help-dropdown') as HTMLElement,
            explorerTrigger: document.getElementById('explorer') as HTMLElement,
            explorerPanel: document.getElementById('explorer-panel') as HTMLElement,
            contentArea: document.querySelector('.content') as HTMLElement,
            explorerContent: document.querySelector('.explorer-content') as HTMLElement,
            newFileBtn: document.getElementById('new-file-btn') as HTMLElement,
            newFolderBtn: document.getElementById('new-folder-btn') as HTMLElement
        };
    }

    private hideAllMenus(): void {
        const elements = this.getMenuElements();
        elements.fileDropdown.classList.remove('show');
        elements.editDropdown.classList.remove('show');
        if (elements.helpDropdown) elements.helpDropdown.classList.remove('show');
    }

    private showMenu(menuElement: HTMLElement, triggerElement: HTMLElement): void {
        const triggerId = triggerElement.id;
        const position = this.menuPositions[triggerId];

        if (position) {
            menuElement.style.left = position.left;
        } else {
            const rect = triggerElement.getBoundingClientRect();
            menuElement.style.left = rect.left + 'px';
        }
        if (menuElement.classList.contains('show')) {
            menuElement.classList.remove('show');
        } else {
            this.hideAllMenus();
            menuElement.classList.add('show');
        }
    }

    // 通用菜单设置函数
    private setupMenu(triggerId: string, dropdownId: string, handlers: (() => void)[]): void {
        const trigger = document.getElementById(triggerId) as HTMLElement;
        const dropdown = document.getElementById(dropdownId) as HTMLElement;
        
        if (!trigger || !dropdown) return;
        
        trigger.addEventListener('click', (e: Event) => {
            e.stopPropagation();
            this.showMenu(dropdown, trigger);
        });
        
        const items = dropdown.querySelectorAll('.menu-item');
        items.forEach((item, index) => {
            item.addEventListener('click', () => {
                if (handlers[index]) {
                    handlers[index]();
                }
                this.hideAllMenus();
            });
        });
    }

    private ensureExplorerVisible(): void {
        const elements = this.getMenuElements();
        if (!elements.explorerTrigger || !elements.explorerPanel) {
            return;
        }
        
        if (!elements.explorerPanel.classList.contains('show')) {
            elements.explorerTrigger.click();
        }
    }

    public ensureSections(): { openEditorsSection: HTMLElement, folderSection: HTMLElement } | null {
        const elements = this.getMenuElements();
        if (!elements.explorerContent) return null;
        let openEditorsSection = elements.explorerContent.querySelector('#open-editors-section') as HTMLElement;
        let folderSection = elements.explorerContent.querySelector('#folder-section') as HTMLElement;
        if (!openEditorsSection) {
            openEditorsSection = document.createElement('div');
            openEditorsSection.id = 'open-editors-section';
            elements.explorerContent.appendChild(openEditorsSection);
        }
        if (!folderSection) {
            const divider = document.createElement('div');
            divider.className = 'section-divider';
            elements.explorerContent.appendChild(divider);
            folderSection = document.createElement('div');
            folderSection.id = 'folder-section';
            elements.explorerContent.appendChild(folderSection);
        }
        return { openEditorsSection, folderSection };
    }

    // 渲染已打开文件列表
    public renderOpenedFiles(): void {
        const sections = this.ensureSections();
        if (!sections) return;
        const { openEditorsSection } = sections;
        
        openEditorsSection.innerHTML = '';
        const title = document.createElement('div');
        title.textContent = 'OPEN EDITORS';
        title.className = 'section-title';
        openEditorsSection.appendChild(title);

        if (this.openedFiles.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'No files opened';
            empty.className = 'empty-state';
            openEditorsSection.appendChild(empty);
            return;
        }

        this.openedFiles.forEach(async filePath => {
            const fileName = filePath.split(/[/\\]/).pop() || filePath;
            const item = document.createElement('div');
            item.className = 'opened-file-item';

            const icon = document.createElement('span');
            // 根据文件类型显示不同图标
            icon.textContent = await this.getFileIcon(filePath);
            const name = document.createElement('span');
            name.textContent = fileName;
            name.className = 'file-name';
            
            const closeBtn = document.createElement('span');
            closeBtn.className = 'close-btn';
            closeBtn.textContent = '×';
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                const index = this.openedFiles.indexOf(filePath);
                if (index > -1) {
                    this.openedFiles.splice(index, 1);
                    this.renderOpenedFiles();
                }
            };
            
            item.appendChild(icon);
            item.appendChild(name);
            item.appendChild(closeBtn);
            openEditorsSection.appendChild(item);
        });
    }

    private setupCreateButton(buttonId: string, type: 'file' | 'folder'): void {
        const button = document.getElementById(buttonId) as HTMLElement;
        if (button) {
            button.addEventListener('click', () => {
                const sections = this.ensureSections();
                if (sections && sections.folderSection) {
                    window.dispatchEvent(new CustomEvent('createInlineInput', { detail: { type } }));
                }
            });
        }
    }

    // 文件菜单处理函数数组
    private getFileHandlers(): (() => void)[] {
        return [
            () => {
                const sections = this.ensureSections();
                if (sections && sections.folderSection) {
                    // 确保资源管理器可见
                    this.ensureExplorerVisible();
                    // 触发项目文件夹自动展开
                    window.dispatchEvent(new CustomEvent('expandProjectFolder'));
                    // 创建文件输入框
                    window.dispatchEvent(new CustomEvent('createInlineInput', { detail: { type: 'file' } }));
                }
            },
            async () => {
                try {
                    const menuAPI = (window as any).menuAPI;
                    if (menuAPI) {
                        await menuAPI.createNewWindow();
                    }
                } catch(err) {
                    console.error('Create new window failed:', err);
                }
            },
            async () => {
                try {
                    const menuAPI = (window as any).menuAPI;
                    if (menuAPI) {
                        const files = await menuAPI.openFileDialog();
                        if (files && files.length) {
                            this.ensureExplorerVisible();
                            files.forEach((p: string) => { 
                                if (!this.openedFiles.includes(p)) this.openedFiles.push(p); 
                            });
                            this.renderOpenedFiles();
                        }
                    }
                } catch(err) { 
                    console.error('Open file failed:', err); 
                }
            },
            async () => {
                try {
                    const menuAPI = (window as any).menuAPI;
                    if (menuAPI) {
                        const dirs = await menuAPI.openFolderDialog();
                        if (dirs && dirs.length) {
                            // 确保资源管理器面板可见
                            this.ensureExplorerVisible();
                            
                            // 等待面板显示动画完成
                            await new Promise(resolve => setTimeout(resolve, 150));
                            
                            this.projectRootPath = dirs[0];
                            
                            // 触发渲染项目根目录事件
                            window.dispatchEvent(new CustomEvent('renderProjectRoot', { 
                                detail: { projectRoot: this.projectRootPath } 
                            }));
                        }
                    }
                } catch(err) { 
                    console.error('Open folder failed:', err); 
                }
            },
            () => {
            },
            () => {
            },
            () => {
                // Exit 功能 - 关闭当前窗口
                try {
                    const menuAPI = (window as any).menuAPI;
                    if (menuAPI) {
                        menuAPI.closeWindow();
                    }
                } catch(err) {
                    console.error('Close window failed:', err);
                }
            }
        ];
    }

    // 编辑菜单处理函数数组
    private getEditHandlers(): (() => void)[] {
        return [
            () => {},
            () => {},
            () => {},
            () => {},
            () => {}
        ];
    }

    // 帮助菜单处理函数数组
    private getHelpHandlers(): (() => void)[] {
        return [
            () => {
                window.open('https://www.electronjs.org/', '_blank');
            },
            () => {
                window.open('https://xtermjs.org/', '_blank');
            },
            () => {
                window.open('instruction.html', '_blank');
            }
        ];
    }

    // 初始化函数
    public initialize(): void {
        // 等待DOM元素可用
        const checkAndInit = () => {
            const fileMenu = document.getElementById('title_file');
            const editMenu = document.getElementById('title_edit');
            const helpMenu = document.getElementById('title_help');
            const newFileBtn = document.getElementById('new-file-btn');
            const newFolderBtn = document.getElementById('new-folder-btn');
            
            if (fileMenu && editMenu && helpMenu && newFileBtn && newFolderBtn) {
                // 初始化所有菜单
                this.setupMenu('title_file', 'file-dropdown', this.getFileHandlers());
                this.setupMenu('title_edit', 'edit-dropdown', this.getEditHandlers());
                this.setupMenu('title_help', 'help-dropdown', this.getHelpHandlers());

                // 初始化创建按钮
                this.setupCreateButton('new-file-btn', 'file');
                this.setupCreateButton('new-folder-btn', 'folder');

                document.addEventListener('click', (e: Event) => {
                    const target = e.target as HTMLElement;
                    if (!target.closest('.menu-trigger') && !target.closest('.dropdown-menu')) {
                        this.hideAllMenus();
                    }
                    
                    if (!target.closest('#folder-section') && !target.closest('.explorer-btn')) {
                        window.dispatchEvent(new CustomEvent('clearFolderSelection'));
                    }
                });

                document.addEventListener('keydown', (e: KeyboardEvent) => {
                    if (e.key === 'Escape') {
                        this.hideAllMenus();
                    }
                });

                // 与 menu.ts 的通信事件监听器
                window.addEventListener('addOpenedFile', (e: Event) => {
                    const customEvent = e as CustomEvent;
                    const { filePath } = customEvent.detail;
                    if (!this.openedFiles.includes(filePath)) {
                        this.openedFiles.push(filePath);
                        this.renderOpenedFiles();
                    }
                });

                window.addEventListener('renderOpenedFiles', () => {
                    this.renderOpenedFiles();
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
export function initializeMenuHandlers(): MenuHandlersManager {
    const menuHandlersManager = new MenuHandlersManager();
    menuHandlersManager.initialize();
    
    // 暴露 ensureSections 方法到全局
    (window as any).ensureSections = () => menuHandlersManager.ensureSections();
    
    return menuHandlersManager;
}