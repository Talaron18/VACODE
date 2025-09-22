"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuHandlersManager = void 0;
exports.initializeMenuHandlers = initializeMenuHandlers;
class MenuHandlersManager {
    constructor() {
        this.openedFiles = []; // 已打开的文件列表
        this.projectRootPath = null; // 项目根路径
        this.menuPositions = {
            'file-menu': { left: '12px' }
        };
    }
    // 通过IPC获取文件类型信息，避免重复代码
    async getFileIcon(filePath) {
        try {
            const menuAPI = window.menuAPI;
            if (menuAPI) {
                const fileType = await menuAPI.getFileType(filePath);
                return fileType?.icon || '📄';
            }
            return '📄';
        }
        catch (error) {
            console.warn('Failed to get file type:', error);
            return '📄';
        }
    }
    // 获取DOM元素的函数
    getMenuElements() {
        return {
            fileMenuTrigger: document.getElementById('title_file'),
            editMenuTrigger: document.getElementById('title_edit'),
            fileDropdown: document.getElementById('file-dropdown'),
            editDropdown: document.getElementById('edit-dropdown'),
            helpMenuTrigger: document.getElementById('title_help'),
            helpDropdown: document.getElementById('help-dropdown'),
            explorerTrigger: document.getElementById('explorer'),
            explorerPanel: document.getElementById('explorer-panel'),
            contentArea: document.querySelector('.content'),
            explorerContent: document.querySelector('.explorer-content'),
            newFileBtn: document.getElementById('new-file-btn'),
            newFolderBtn: document.getElementById('new-folder-btn')
        };
    }
    hideAllMenus() {
        const elements = this.getMenuElements();
        elements.fileDropdown.classList.remove('show');
        elements.editDropdown.classList.remove('show');
        if (elements.helpDropdown)
            elements.helpDropdown.classList.remove('show');
    }
    showMenu(menuElement, triggerElement) {
        const triggerId = triggerElement.id;
        const position = this.menuPositions[triggerId];
        if (position) {
            menuElement.style.left = position.left;
        }
        else {
            const rect = triggerElement.getBoundingClientRect();
            menuElement.style.left = rect.left + 'px';
        }
        if (menuElement.classList.contains('show')) {
            menuElement.classList.remove('show');
        }
        else {
            this.hideAllMenus();
            menuElement.classList.add('show');
        }
    }
    // 通用菜单设置函数
    setupMenu(triggerId, dropdownId, handlers) {
        const trigger = document.getElementById(triggerId);
        const dropdown = document.getElementById(dropdownId);
        if (!trigger || !dropdown)
            return;
        trigger.addEventListener('click', (e) => {
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
    ensureExplorerVisible() {
        const elements = this.getMenuElements();
        if (!elements.explorerTrigger || !elements.explorerPanel) {
            return;
        }
        if (!elements.explorerPanel.classList.contains('show')) {
            elements.explorerTrigger.click();
        }
    }
    ensureSections() {
        const elements = this.getMenuElements();
        if (!elements.explorerContent)
            return null;
        let openEditorsSection = elements.explorerContent.querySelector('#open-editors-section');
        let folderSection = elements.explorerContent.querySelector('#folder-section');
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
    renderOpenedFiles() {
        const sections = this.ensureSections();
        if (!sections)
            return;
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
        this.openedFiles.forEach(async (filePath) => {
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
    setupCreateButton(buttonId, type) {
        const button = document.getElementById(buttonId);
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
    getFileHandlers() {
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
                    const menuAPI = window.menuAPI;
                    if (menuAPI) {
                        await menuAPI.createNewWindow();
                    }
                }
                catch (err) {
                    console.error('Create new window failed:', err);
                }
            },
            async () => {
                try {
                    const menuAPI = window.menuAPI;
                    if (menuAPI) {
                        const files = await menuAPI.openFileDialog();
                        if (files && files.length) {
                            this.ensureExplorerVisible();
                            files.forEach((p) => {
                                if (!this.openedFiles.includes(p))
                                    this.openedFiles.push(p);
                            });
                            this.renderOpenedFiles();
                        }
                    }
                }
                catch (err) {
                    console.error('Open file failed:', err);
                }
            },
            async () => {
                try {
                    const menuAPI = window.menuAPI;
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
                }
                catch (err) {
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
                    const menuAPI = window.menuAPI;
                    if (menuAPI) {
                        menuAPI.closeWindow();
                    }
                }
                catch (err) {
                    console.error('Close window failed:', err);
                }
            }
        ];
    }
    // 编辑菜单处理函数数组
    getEditHandlers() {
        return [
            () => { },
            () => { },
            () => { },
            () => { },
            () => { }
        ];
    }
    // 帮助菜单处理函数数组
    getHelpHandlers() {
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
    initialize() {
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
                document.addEventListener('click', (e) => {
                    const target = e.target;
                    if (!target.closest('.menu-trigger') && !target.closest('.dropdown-menu')) {
                        this.hideAllMenus();
                    }
                    if (!target.closest('#folder-section') && !target.closest('.explorer-btn')) {
                        window.dispatchEvent(new CustomEvent('clearFolderSelection'));
                    }
                });
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        this.hideAllMenus();
                    }
                });
                // 与 menu.ts 的通信事件监听器
                window.addEventListener('addOpenedFile', (e) => {
                    const customEvent = e;
                    const { filePath } = customEvent.detail;
                    if (!this.openedFiles.includes(filePath)) {
                        this.openedFiles.push(filePath);
                        this.renderOpenedFiles();
                    }
                });
                window.addEventListener('renderOpenedFiles', () => {
                    this.renderOpenedFiles();
                });
            }
            else {
                // 如果DOM元素还没准备好，等待一下再试
                setTimeout(checkAndInit, 10);
            }
        };
        checkAndInit();
    }
}
exports.MenuHandlersManager = MenuHandlersManager;
// 导出便捷函数
function initializeMenuHandlers() {
    const menuHandlersManager = new MenuHandlersManager();
    menuHandlersManager.initialize();
    // 暴露 ensureSections 方法到全局
    window.ensureSections = () => menuHandlersManager.ensureSections();
    return menuHandlersManager;
}
//# sourceMappingURL=menu-handlers.js.map