"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuManager = void 0;
exports.initializeMenu = initializeMenu;
class MenuManager {
    constructor() {
        // 状态变量
        this.currentInputType = null; // 当前输入类型
        this.currentInputContainer = null; // 当前输入容器
        this.currentInputElement = null; // 当前输入元素
        this.selectedFolderPath = null; // 选中的文件夹路径
        this.selectedFolderElement = null; // 选中的文件夹元素
        this.isRefreshing = false; // 是否正在刷新
        // 文件树状态管理
        this.currentExplorerRoot = null; // 当前资源管理器根目录
        this.expandedFolders = new Set(); // 已展开的文件夹集合
        this.folderStructure = new Map(); // 文件夹结构缓存
        this.projectRootPath = null; // 项目根路径
    }
    // 获取DOM元素的函数
    getExplorerElements() {
        return {
            explorerTrigger: document.getElementById('explorer'),
            explorerPanel: document.getElementById('explorer-panel'),
            contentArea: document.querySelector('.content'),
            explorerResizeHandle: document.getElementById('explorer-resize-handle'),
            newFileBtn: document.getElementById('new-file-btn'),
            newFolderBtn: document.getElementById('new-folder-btn'),
            explorerContent: document.querySelector('.explorer-content')
        };
    }
    // 根据路径查找对应的DOM元素
    findElementByPath(path) {
        let element = document.querySelector(`[data-path="${path}"]`);
        if (!element) {
            const escapedPath = path.replace(/\\/g, '\\\\');
            element = document.querySelector(`[data-path="${escapedPath}"]`);
        }
        if (!element) {
            const allElements = document.querySelectorAll('[data-path]');
            for (const el of allElements) {
                const elementPath = el.getAttribute('data-path');
                if (elementPath === path) {
                    element = el;
                    break;
                }
            }
        }
        return element;
    }
    // 延迟恢复文件夹选择状态
    restoreSelectionAfterDelay(currentSelected, delay = 500) {
        if (currentSelected) {
            setTimeout(() => {
                this.setSelectedFolder(currentSelected);
                this.isRefreshing = false;
            }, delay);
        }
        else {
            this.isRefreshing = false;
        }
    }
    // 包装异步操作，设置刷新标志
    withRefreshingFlag(operation) {
        this.isRefreshing = true;
        return operation().finally(() => {
            this.isRefreshing = false;
        });
    }
    // 设置选中的文件夹
    setSelectedFolder(folderPath, element) {
        if (this.selectedFolderElement) {
            this.selectedFolderElement.classList.remove('selected');
        }
        this.selectedFolderPath = folderPath;
        this.selectedFolderElement = element || this.findElementByPath(folderPath);
        if (this.selectedFolderElement) {
            this.selectedFolderElement.classList.add('selected');
        }
    }
    clearFolderSelection() {
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
    createInlineInput(type) {
        if (this.currentInputElement && this.currentInputElement.value.trim()) {
            this.currentInputElement.focus();
            this.currentInputElement.select();
            return;
        }
        this.removeInlineInput();
        // 根据选中的文件夹动态调整输入框位置
        let targetFolderElement = null;
        if (this.selectedFolderPath && this.selectedFolderElement) {
            // 如果有选中的子文件夹，使用选中的子文件夹
            targetFolderElement = this.selectedFolderElement;
        }
        else {
            // 如果没有选中子文件夹，使用主文件夹
            targetFolderElement = document.querySelector('[data-level="0"]');
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
                const arrow = targetFolderElement.querySelector('span');
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
                }
                else {
                    parent.appendChild(container);
                }
            }
            // 设置输入框的缩进级别（目标文件夹的子级）
            const targetLevel = parseInt(targetFolderElement.getAttribute('data-level') || '0');
            const inputLevel = targetLevel + 1;
            container.style.paddingLeft = (4 + inputLevel * 16) + 'px';
        }
        else {
            // 如果找不到目标文件夹元素，回退到原来的逻辑
            const sections = window.ensureSections ? window.ensureSections() : null;
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
    removeInlineInput() {
        if (this.currentInputContainer) {
            this.currentInputContainer.remove();
            this.currentInputContainer = null;
            this.currentInputElement = null;
            this.currentInputType = null;
        }
    }
    async handleInputKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const name = this.currentInputElement?.value.trim();
            if (name) {
                await this.createItem(name);
                setTimeout(() => {
                    this.removeInlineInput();
                }, 200);
            }
        }
        else if (e.key === 'Escape') {
            e.preventDefault();
            this.removeInlineInput();
        }
    }
    async handleInputBlur() {
        setTimeout(async () => {
            if (this.currentInputElement) {
                const name = this.currentInputElement.value.trim();
                if (name) {
                    await this.createItem(name);
                    setTimeout(() => {
                        this.removeInlineInput();
                    }, 200);
                }
                else {
                    this.removeInlineInput();
                }
            }
        }, 100);
    }
    // 创建文件或文件夹
    async createItem(name) {
        if (!this.currentInputType || !name.trim())
            return;
        try {
            this.isRefreshing = true;
            // 如果有选中的子文件夹，则在子文件夹中创建；否则在主文件夹中创建
            const menuAPI = window.menuAPI;
            if (!menuAPI) {
                throw new Error('Menu API not available');
            }
            const targetDir = this.selectedFolderPath || this.projectRootPath || await menuAPI.getProjectRoot();
            let created;
            if (this.currentInputType === 'file') {
                created = await menuAPI.createFile(name.trim(), targetDir);
            }
            else {
                created = await menuAPI.createFolder(name.trim(), targetDir);
            }
            setTimeout(() => {
                this.refreshSpecificFolder(targetDir);
            }, 200);
        }
        catch (err) {
            console.error(`创建${this.currentInputType === 'file' ? '文件' : '文件夹'}失败:`, err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            alert(`创建${this.currentInputType === 'file' ? '文件' : '文件夹'}失败: ${errorMessage}`);
            this.isRefreshing = false;
        }
    }
    // 创建文件树项目元素
    createTreeItem(item, level = 0) {
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
            arrow.onclick = async (e) => {
                e.stopPropagation();
                await this.toggleFolder(item.path, row, level);
            };
            row.appendChild(arrow);
        }
        else {
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
            }
            else if (iconSize === 'large') {
                icon.style.fontSize = '18px';
                icon.style.width = '20px';
                icon.style.height = '20px';
            }
            // normal 使用默认大小，不需要设置
            row.appendChild(icon);
        }
        const name = document.createElement('span');
        name.id = 'file-name';
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
        row.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (item.type === 'dir') {
                if (e.ctrlKey || e.metaKey) {
                    this.setSelectedFolder(item.path, row);
                }
                else {
                    this.setSelectedFolder(item.path, row);
                    await this.toggleFolder(item.path, row, level);
                }
            }
            else {
                window.dispatchEvent(new CustomEvent('addOpenedFile', { detail: { filePath: item.path } }));
                this.clearFolderSelection();
            }
        });
        return row;
    }
    // 切换文件夹展开/折叠状态
    async toggleFolder(folderPath, row, level) {
        const isExpanded = this.expandedFolders.has(folderPath);
        const arrow = row.querySelector('span');
        if (isExpanded) {
            this.expandedFolders.delete(folderPath);
            arrow.textContent = '▶';
            let nextSibling = row.nextElementSibling;
            while (nextSibling) {
                const nextLevel = parseInt(nextSibling.getAttribute('data-level') || '0');
                if (nextLevel <= level) {
                    break;
                }
                const childPath = nextSibling.getAttribute('data-path');
                if (childPath) {
                    this.expandedFolders.delete(childPath);
                }
                const toRemove = nextSibling;
                nextSibling = nextSibling.nextElementSibling;
                toRemove.remove();
            }
        }
        else {
            this.expandedFolders.add(folderPath);
            arrow.textContent = '▼';
            try {
                const menuAPI = window.menuAPI;
                if (!menuAPI) {
                    throw new Error('Menu API not available');
                }
                const items = await menuAPI.listDirectory(folderPath);
                const parent = row.parentElement;
                if (parent) {
                    const insertIndex = Array.from(parent.children).indexOf(row) + 1;
                    items.forEach((item) => {
                        const childRow = this.createTreeItem(item, level + 1);
                        parent.insertBefore(childRow, parent.children[insertIndex]);
                    });
                }
            }
            catch (err) {
                console.error('Failed to load folder contents:', err);
            }
        }
    }
    async refreshSpecificFolder(folderPath) {
        try {
            const currentSelected = this.selectedFolderPath;
            const folderElement = this.findElementByPath(folderPath);
            if (folderElement) {
                const level = parseInt(folderElement.getAttribute('data-level') || '0');
                if (this.expandedFolders.has(folderPath)) {
                    await this.refreshFolderContents(folderPath, folderElement, level);
                }
            }
            else {
                await this.refreshRootLevel();
            }
            this.restoreSelectionAfterDelay(currentSelected);
        }
        catch (err) {
            console.error('Failed to refresh specific folder:', err);
            this.isRefreshing = false;
        }
    }
    async refreshFolderTree() {
        const currentExpanded = new Set(this.expandedFolders);
        const currentSelected = this.selectedFolderPath;
        await this.refreshRootLevel();
        for (const path of currentExpanded) {
            const element = document.querySelector(`[data-path="${path}"]`);
            if (element) {
                const level = parseInt(element.getAttribute('data-level') || '0');
                await this.refreshFolderContents(path, element, level);
            }
        }
        if (currentSelected) {
            const element = document.querySelector(`[data-path="${currentSelected}"]`);
            if (element) {
                this.setSelectedFolder(currentSelected, element);
            }
        }
    }
    async refreshRootLevel() {
        const sections = window.ensureSections ? window.ensureSections() : null;
        if (!sections)
            return;
        const { folderSection } = sections;
        try {
            const currentSelected = this.selectedFolderPath;
            if (!this.projectRootPath) {
                const menuAPI = window.menuAPI;
                if (menuAPI) {
                    this.projectRootPath = await menuAPI.getProjectRoot();
                }
            }
            const rootElement = folderSection.querySelector('[data-level="0"]');
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
        }
        catch (err) {
            console.error('Refresh root level failed:', err);
        }
    }
    async refreshFolderContents(folderPath, folderElement, level) {
        return this.withRefreshingFlag(async () => {
            const currentSelected = this.selectedFolderPath;
            const menuAPI = window.menuAPI;
            if (!menuAPI) {
                throw new Error('Menu API not available');
            }
            const items = await menuAPI.listDirectory(folderPath);
            const parent = folderElement.parentElement;
            if (!parent)
                return;
            const expandedChildFolders = new Map();
            let nextSibling = folderElement.nextElementSibling;
            while (nextSibling) {
                const nextLevel = parseInt(nextSibling.getAttribute('data-level') || '0');
                if (nextLevel <= level)
                    break;
                const childPath = nextSibling.getAttribute('data-path');
                if (childPath && this.expandedFolders.has(childPath)) {
                    expandedChildFolders.set(childPath, nextLevel);
                }
                const toRemove = nextSibling;
                nextSibling = nextSibling.nextElementSibling;
                toRemove.remove();
            }
            if (this.expandedFolders.has(folderPath)) {
                const insertIndex = Array.from(parent.children).indexOf(folderElement) + 1;
                items.forEach((item) => {
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
    async expandFolderDirectlyWithChildren(folderPath, row, level) {
        return this.withRefreshingFlag(async () => {
            const currentSelected = this.selectedFolderPath;
            this.expandedFolders.add(folderPath);
            const arrow = row.querySelector('span');
            if (arrow) {
                arrow.textContent = '▼';
            }
            const menuAPI = window.menuAPI;
            if (!menuAPI) {
                throw new Error('Menu API not available');
            }
            const items = await menuAPI.listDirectory(folderPath);
            const parent = row.parentElement;
            if (parent) {
                const insertIndex = Array.from(parent.children).indexOf(row) + 1;
                items.forEach((item) => {
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
    async expandFolderDirectly(folderPath, row, level) {
        try {
            this.expandedFolders.add(folderPath);
            const arrow = row.querySelector('span');
            if (arrow) {
                arrow.textContent = '▼';
            }
            const menuAPI = window.menuAPI;
            if (!menuAPI) {
                throw new Error('Menu API not available');
            }
            const items = await menuAPI.listDirectory(folderPath);
            const parent = row.parentElement;
            if (parent) {
                const insertIndex = Array.from(parent.children).indexOf(row) + 1;
                items.forEach((item) => {
                    const childRow = this.createTreeItem(item, level + 1);
                    parent.insertBefore(childRow, parent.children[insertIndex]);
                });
            }
        }
        catch (err) {
            console.error('Failed to expand folder directly:', err);
        }
    }
    // 自动展开项目文件夹
    async expandProjectFolder() {
        try {
            // 确保项目根目录已渲染
            if (!this.projectRootPath) {
                const menuAPI = window.menuAPI;
                if (menuAPI) {
                    this.projectRootPath = await menuAPI.getProjectRoot();
                }
            }
            // 查找主文件夹元素
            const mainFolderElement = document.querySelector('[data-level="0"]');
            if (mainFolderElement) {
                const mainFolderPath = mainFolderElement.getAttribute('data-path');
                if (mainFolderPath && !this.expandedFolders.has(mainFolderPath)) {
                    // 展开主文件夹
                    const level = parseInt(mainFolderElement.getAttribute('data-level') || '0');
                    await this.expandFolderDirectly(mainFolderPath, mainFolderElement, level);
                }
            }
        }
        catch (err) {
            console.error('Failed to expand project folder:', err);
        }
    }
    // 渲染项目根目录
    async renderProjectRoot() {
        const sections = window.ensureSections ? window.ensureSections() : null;
        if (!sections) {
            setTimeout(() => this.renderProjectRoot(), 100);
            return;
        }
        const { folderSection } = sections;
        try {
            if (!this.projectRootPath) {
                const menuAPI = window.menuAPI;
                if (menuAPI) {
                    this.projectRootPath = await menuAPI.getProjectRoot();
                }
                else {
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
            const menuAPI = window.menuAPI;
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
                }
                else {
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
        }
        catch (err) {
            console.error('Render project root failed:', err);
        }
    }
    // 初始化函数
    initialize() {
        // 等待DOM元素可用
        const checkAndInit = () => {
            const elements = this.getExplorerElements();
            if (elements.explorerTrigger && elements.explorerPanel && elements.contentArea) {
                document.addEventListener('click', (e) => {
                    const target = e.target;
                    if (!target.closest('#folder-section') && !target.closest('.explorer-btn')) {
                        this.clearFolderSelection();
                    }
                });
                elements.explorerTrigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isShowing = elements.explorerPanel.classList.toggle('show');
                    if (isShowing) {
                        const aiPanel = document.getElementById('ai-panel');
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
                        if (!elements.explorerContent.querySelector('#folder-section'))
                            this.renderProjectRoot();
                    }
                    else {
                        elements.contentArea.classList.remove('shifted');
                        elements.contentArea.style.marginLeft = '60px';
                    }
                    // 同步调整终端位置
                    if (window.adjustTerminalPosition) {
                        window.adjustTerminalPosition();
                    }
                    setTimeout(() => {
                        elements.contentArea.classList.remove('resizing');
                    }, 100);
                });
                if (elements.explorerResizeHandle) {
                    let isResizing = false;
                    let startX = 0;
                    let startWidth = 0;
                    const minWidth = 180;
                    elements.explorerResizeHandle.addEventListener('mousedown', function (e) {
                        isResizing = true;
                        startX = e.clientX;
                        startWidth = elements.explorerPanel.getBoundingClientRect().width;
                        document.body.style.userSelect = 'none';
                        elements.contentArea.classList.add('resizing');
                    });
                    document.addEventListener('mousemove', function (e) {
                        if (!isResizing)
                            return;
                        const delta = e.clientX - startX;
                        let newWidth = startWidth + delta;
                        const maxWidth = Math.floor(window.innerWidth * 0.5);
                        if (newWidth < minWidth)
                            newWidth = minWidth;
                        if (newWidth > maxWidth)
                            newWidth = maxWidth;
                        elements.explorerPanel.style.width = newWidth + 'px';
                        const menuWidth = 50;
                        elements.contentArea.style.marginLeft = (menuWidth + newWidth + 10) + 'px';
                        // 同步调整终端位置
                        if (window.adjustTerminalPosition) {
                            window.adjustTerminalPosition();
                        }
                    });
                    document.addEventListener('mouseup', function () {
                        if (!isResizing)
                            return;
                        isResizing = false;
                        document.body.style.userSelect = '';
                        elements.contentArea.classList.remove('resizing');
                    });
                    // 窗口大小改变时自动调整Explorer面板宽度
                    window.addEventListener('resize', function () {
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
                                if (window.adjustTerminalPosition) {
                                    window.adjustTerminalPosition();
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
                window.addEventListener('createInlineInput', (e) => {
                    const customEvent = e;
                    const { type } = customEvent.detail;
                    this.createInlineInput(type);
                });
                window.addEventListener('clearFolderSelection', () => {
                    this.clearFolderSelection();
                });
                window.addEventListener('renderProjectRoot', (e) => {
                    const customEvent = e;
                    const { projectRoot } = customEvent.detail;
                    this.projectRootPath = projectRoot;
                    this.renderProjectRoot();
                });
                window.addEventListener('expandProjectFolder', async () => {
                    // 自动展开项目文件夹
                    await this.expandProjectFolder();
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
exports.MenuManager = MenuManager;
// 导出便捷函数
function initializeMenu() {
    const menuManager = new MenuManager();
    menuManager.initialize();
    return menuManager;
}
//# sourceMappingURL=menu.js.map