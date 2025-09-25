import { editorManager } from './editor';

export class MenuHandlersManager {
    private projectRootPath: string | null = null;
    private menuPositions: { [key: string]: { left: string } } = {
        'file-menu': { left: '12px' }
    };

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

        if (triggerId === 'title_edit') {
            editorManager.saveCurrentSelection();
        }

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

    public ensureSections(): { folderSection: HTMLElement } | null {
        const elements = this.getMenuElements();
        if (!elements.explorerContent) return null;
        let folderSection = elements.explorerContent.querySelector('#folder-section') as HTMLElement;
        if (!folderSection) {
            folderSection = document.createElement('div');
            folderSection.id = 'folder-section';
            elements.explorerContent.appendChild(folderSection);
        }
        return { folderSection };
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


    private getFileHandlers(): (() => void)[] {
        return [
            () => {
                const sections = this.ensureSections();
                if (sections && sections.folderSection) {
                    this.ensureExplorerVisible();
                    window.dispatchEvent(new CustomEvent('expandProjectFolder'));
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
                            const filePath = files[0];
                            window.dispatchEvent(new CustomEvent('addOpenedFile', {
                                detail: { filePath: filePath }
                            }));
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
                            this.ensureExplorerVisible();
                            
                            await new Promise(resolve => setTimeout(resolve, 150));
                            
                            this.projectRootPath = dirs[0];
                            
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
                editorManager.save();
            },
            () => {
                editorManager.saveAs();
            },
            () => {
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

    private getEditHandlers(): (() => void)[] {
        return [
            () => {
                editorManager.undo();
            },
            () => {
                editorManager.redo();
            },
            () => {
                editorManager.cut();
            },
            () => {
                editorManager.copy();
            },
            () => {
                editorManager.paste();
            }
        ];
    }

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

    public initialize(): void {
        const checkAndInit = () => {
            const fileMenu = document.getElementById('title_file');
            const editMenu = document.getElementById('title_edit');
            const helpMenu = document.getElementById('title_help');
            const newFileBtn = document.getElementById('new-file-btn');
            const newFolderBtn = document.getElementById('new-folder-btn');
            
            if (fileMenu && editMenu && helpMenu && newFileBtn && newFolderBtn) {
                this.setupMenu('title_file', 'file-dropdown', this.getFileHandlers());
                this.setupMenu('title_edit', 'edit-dropdown', this.getEditHandlers());
                this.setupMenu('title_help', 'help-dropdown', this.getHelpHandlers());

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

            } else {
                setTimeout(checkAndInit, 10);
            }
        };
        
        checkAndInit();
    }
}

export function initializeMenuHandlers(): MenuHandlersManager {
    const menuHandlersManager = new MenuHandlersManager();
    menuHandlersManager.initialize();
    
    (window as any).ensureSections = () => menuHandlersManager.ensureSections();
    
    return menuHandlersManager;
}