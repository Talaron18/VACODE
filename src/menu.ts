import { themeManager } from './theme-manager';

export class MenuManager {
    private currentInputType: 'file' | 'folder' | null = null;
    private currentInputContainer: HTMLElement | null = null;
    private currentInputElement: HTMLInputElement | null = null;
    private selectedFolderPath: string | null = null;
    private selectedFolderElement: HTMLElement | null = null;
    private isRefreshing: boolean = false;

    private currentExplorerRoot: string | null = null;
    private expandedFolders = new Set<string>();
    private folderStructure = new Map<string, any>();
    private projectRootPath: string | null = null;

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

    private withRefreshingFlag<T>(operation: () => Promise<T>): Promise<T> {
        this.isRefreshing = true;
        return operation().finally(() => {
            this.isRefreshing = false;
        });
    }

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

    private createInlineInput(type: 'file' | 'folder'): void {
        if (this.currentInputElement && this.currentInputElement.value.trim()) {
            this.currentInputElement.focus();
            this.currentInputElement.select();
            return;
        }
        
        this.removeInlineInput();
        
        let targetFolderElement: HTMLElement | null = null;
        
        if (this.selectedFolderPath && this.selectedFolderElement) {
            targetFolderElement = this.selectedFolderElement;
        } else {
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
        input.placeholder = type === 'file' ? 'File name' : 'Folder name';
        input.autocomplete = 'off';
        input.spellcheck = false;
        
        container.appendChild(icon);
        container.appendChild(input);
        
        if (targetFolderElement) {
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
                const nextSibling = targetFolderElement.nextElementSibling;
                if (nextSibling) {
                    parent.insertBefore(container, nextSibling);
                } else {
                    parent.appendChild(container);
                }
            }
            
            const targetLevel = parseInt(targetFolderElement.getAttribute('data-level') || '0');
            const inputLevel = targetLevel + 1;
            container.style.paddingLeft = (4 + inputLevel * 16) + 'px';
        } else {
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

    private async createItem(name: string): Promise<void> {
        if (!this.currentInputType || !name.trim()) return;
        
        try {
            this.isRefreshing = true;
            
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
            console.error(`Failed to create ${this.currentInputType === 'file' ? 'file' : 'folder'}:`, err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            alert(`Failed to create ${this.currentInputType === 'file' ? 'file' : 'folder'}: ${errorMessage}`);
            this.isRefreshing = false;
        }
    }


    private createTreeItem(item: any, level: number = 0): HTMLElement {
        const row = document.createElement('div');
        row.className = 'tree-item';
        row.style.paddingLeft = (4 + level * 16) + 'px';
        row.setAttribute('data-level', level.toString());
        row.setAttribute('data-path', item.path);

        if (item.type === 'dir') {
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
            const icon = document.createElement('span');
            const iconClass = item.fileType ? item.fileType.iconclass : 'icon-txt';
            const iconSize = item.fileType ? item.fileType.size : 'normal';
            
            icon.className = `tree-icon iconfont ${iconClass}`;
            
            const currentTheme = document.body.classList.contains('theme-light') ? 'light' : 'dark';
            const themeColor = this.getIconColorForTheme(iconClass, currentTheme);
            icon.style.color = themeColor || (item.fileType ? item.fileType.color : '#666666');
            
            if (iconSize === 'small') {
                icon.style.fontSize = '10px';
                icon.style.width = '12px';
                icon.style.height = '12px';
            } else if (iconSize === 'large') {
                icon.style.fontSize = '18px';
                icon.style.width = '20px';
                icon.style.height = '20px';
            }
            
            row.appendChild(icon);
        }

        const name = document.createElement('span');
        name.id='file-name';
        name.textContent = item.name;
        name.className = 'tree-name';
        row.appendChild(name);

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
            
            setTimeout(() => {
                themeManager.forceUpdateFileIconColors();
            }, 200);
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
            
            setTimeout(() => {
                themeManager.forceUpdateEditorTheme();
            }, 100);
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

    private async expandProjectFolder(): Promise<void> {
        try {
            if (!this.projectRootPath) {
                const menuAPI = (window as any).menuAPI;
                if (menuAPI) {
                    this.projectRootPath = await menuAPI.getProjectRoot();
                }
            }
            
            const mainFolderElement = document.querySelector('[data-level="0"]') as HTMLElement;
            if (mainFolderElement) {
                const mainFolderPath = mainFolderElement.getAttribute('data-path');
                if (mainFolderPath && !this.expandedFolders.has(mainFolderPath)) {
                    const level = parseInt(mainFolderElement.getAttribute('data-level') || '0');
                    await this.expandFolderDirectly(mainFolderPath, mainFolderElement, level);
                }
            }
        } catch (err) {
            console.error('Failed to expand project folder:', err);
        }
    }

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

    public initialize(): void {
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
                    const newMarginLeft = menuWidth + panelWidth + 10;
                    elements.contentArea.style.marginLeft = newMarginLeft + 'px';
                    
                    const editTermContainer = document.querySelector('.edit-term-container') as HTMLElement;
                    if (editTermContainer) {
                        editTermContainer.style.width = `calc(100% - ${newMarginLeft}px)`;
                    }
                    
                    window.dispatchEvent(new CustomEvent('renderOpenedFiles'));
                    if (!elements.explorerContent.querySelector('#folder-section')) this.renderProjectRoot();
                } else {
                    elements.contentArea.classList.remove('shifted');
                    elements.contentArea.style.marginLeft = '60px';
                    
                    const editTermContainer = document.querySelector('.edit-term-container') as HTMLElement;
                    if (editTermContainer) {
                        editTermContainer.style.width = 'calc(100% - 60px)';
                    }
                }
                
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
                    const newMarginLeft = menuWidth + newWidth + 10;
                    elements.contentArea.style.marginLeft = newMarginLeft + 'px';
                    
                    const editTermContainer = document.querySelector('.edit-term-container') as HTMLElement;
                    if (editTermContainer) {
                        editTermContainer.style.width = `calc(100% - ${newMarginLeft}px)`;
                    }
                    
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

                window.addEventListener('resize', function() {
                    if (elements.explorerPanel && elements.contentArea) {
                        const currentWidth = elements.explorerPanel.getBoundingClientRect().width;
                        const maxWidth = Math.floor(window.innerWidth * 0.5);
                        
                        if (currentWidth > maxWidth) {
                            elements.contentArea.classList.add('resizing');
                            
                            elements.explorerPanel.style.width = maxWidth + 'px';
                            const menuWidth = 50;
                            const newMarginLeft = menuWidth + maxWidth + 10;
                            elements.contentArea.style.marginLeft = newMarginLeft + 'px';
                            
                            const editTermContainer = document.querySelector('.edit-term-container') as HTMLElement;
                            if (editTermContainer) {
                                editTermContainer.style.width = `calc(100% - ${newMarginLeft}px)`;
                            }
                            
                            if ((window as any).adjustTerminalPosition) {
                                (window as any).adjustTerminalPosition();
                            }
                            
                            setTimeout(() => {
                                elements.contentArea.classList.remove('resizing');
                            }, 10);
                        }
                    }
                });
            }

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
                await this.expandProjectFolder();
            });
        } else {
            setTimeout(checkAndInit, 10);
        }
    };
    
    checkAndInit();
    }

    private getIconColorForTheme(iconClass: string, theme: 'light' | 'dark'): string | null {
        const lightThemeIconColors: Record<string, string> = {
            'icon-lnk-f': '#5f6368',
            'icon-txt': '#5f6368',
            'icon-env': '#5f6368',
            'icon-gitignore': '#5f6368',
            'icon-dockerfile': '#5f6368',
            'icon-RTF': '#5f6368',
            'icon-ico': '#5f6368',
            'icon-ttf': '#5f6368',
            'icon-mysql': '#5f6368',
        };

        const darkThemeIconColors: Record<string, string> = {
            'icon-lnk-f': '#ffffff',
            'icon-txt': '#cccccc',
            'icon-env': '#f0f0f0',
            'icon-gitignore': '#3178c6',
            'icon-dockerfile': '#2496ed',
            'icon-RTF': '#cccccc',
            'icon-ico': '#ff6b6b',
            'icon-ttf': '#8b4513',
            'icon-mysql': '#336791',
        };

        for (const [iconKey, color] of Object.entries(theme === 'light' ? lightThemeIconColors : darkThemeIconColors)) {
            if (iconClass.includes(iconKey)) {
                return color;
            }
        }

        return null;
    }
}

export function initializeMenu(): MenuManager {
    const menuManager = new MenuManager();
    menuManager.initialize();
    return menuManager;
}