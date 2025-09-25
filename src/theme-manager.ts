export type ThemeMode = 'light' | 'dark';

class ThemeManager {
    private currentTheme: ThemeMode = 'dark';
    private readonly THEME_STORAGE_KEY = 'vacode-theme';

    constructor() {
        this.initializeTheme();
    }

    private initializeTheme(): void {
        const savedTheme = localStorage.getItem(this.THEME_STORAGE_KEY) as ThemeMode;
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
            this.currentTheme = savedTheme;
        }
        
        this.applyTheme(this.currentTheme);
        
        setTimeout(() => {
            this.updateFileIconColors(this.currentTheme);
        }, 1000);
    }

    public toggleTheme(): void {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(this.currentTheme);
        this.saveTheme();
    }

    public setTheme(theme: ThemeMode): void {
        if (this.currentTheme !== theme) {
            this.currentTheme = theme;
            this.applyTheme(theme);
            this.saveTheme();
        }
    }

    public getCurrentTheme(): ThemeMode {
        return this.currentTheme;
    }

    private applyTheme(theme: ThemeMode): void {
        const body = document.body;
        
        body.classList.remove('theme-light', 'theme-dark');
        
        body.classList.add(`theme-${theme}`);
        
        this.updateMonacoTheme(theme);
        
        this.updateTerminalTheme(theme);
        
        this.updateEditorHeadTheme(theme);
        
        this.updateFileIconColors(theme);
    }

    private updateMonacoTheme(theme: ThemeMode): void {
        if (typeof (window as any).monaco !== 'undefined') {
            const monacoTheme = theme === 'light' ? 'vs' : 'vs-dark';
            (window as any).monaco.editor.setTheme(monacoTheme);
        }
    }

    private updateTerminalTheme(theme: ThemeMode): void {
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: theme }
        }));
    }

    private updateEditorHeadTheme(theme: ThemeMode): void {
        const editorHead = document.getElementById('editor-head');
        if (editorHead) {
            const bgColor = theme === 'light' ? '#e8eaed' : '#212121ff';
            editorHead.style.backgroundColor = bgColor;
        }

        const editorHeadTitle = document.getElementById('editor-head-title');
        if (editorHeadTitle) {
            const textColor = theme === 'light' ? '#5f6368' : '#fff';
            editorHeadTitle.style.color = textColor;
        }

        const editorCloseBtn = document.getElementById('editor-close-btn');
        if (editorCloseBtn) {
            const btnColor = theme === 'light' ? '#5f6368' : '#fff';
            const borderColor = theme === 'light' ? '1px solid #dadce050' : '1px solid #ffffff50';
            editorCloseBtn.style.color = btnColor;
            editorCloseBtn.style.borderRight = borderColor;
        }

        const editorContainer = document.getElementById('monaco-editor-container');
        if (editorContainer) {
            const borderColor = theme === 'light' ? '1px solid #dadce0' : '1px solid #656565';
            editorContainer.style.borderTop = borderColor;
        }
    }

    private updateFileIconColors(theme: ThemeMode): void {
        const fileIcons = document.querySelectorAll('.tree-icon.iconfont');
        
        fileIcons.forEach((icon) => {
            const iconElement = icon as HTMLElement;
            const iconClass = iconElement.className;
            
            let newColor = this.getIconColorForTheme(iconClass, theme);
            if (newColor) {
                iconElement.style.color = newColor;
            }
        });
    }

    private getIconColorForTheme(iconClass: string, theme: ThemeMode): string | null {
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

    public forceUpdateEditorTheme(): void {
        this.updateEditorHeadTheme(this.currentTheme);
        this.updateMonacoTheme(this.currentTheme);
        this.updateFileIconColors(this.currentTheme);
        
        setTimeout(() => {
            this.updateMonacoTheme(this.currentTheme);
        }, 50);
    }

    public forceUpdateFileIconColors(): void {
        this.updateFileIconColors(this.currentTheme);
    }

    private saveTheme(): void {
        localStorage.setItem(this.THEME_STORAGE_KEY, this.currentTheme);
    }

    public initializeViewButton(): void {
        const viewButton = document.getElementById('title_view');
        if (viewButton) {
            viewButton.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }
}

export const themeManager = new ThemeManager();

export function initializeThemeManager(): void {
    themeManager.initializeViewButton();
}