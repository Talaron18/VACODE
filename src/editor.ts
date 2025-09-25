import * as monaco from 'monaco-editor';
import { themeManager } from './theme-manager';
import { homePage } from './home-page';


class EditorManager {
    private currentEditor: monaco.editor.IStandaloneCodeEditor | null = null;
    private currentFilePath: string | null = null;
    private savedSelection: monaco.Selection | null = null;

    setCurrentEditor(editor: monaco.editor.IStandaloneCodeEditor, filePath: string) {
        this.currentEditor = editor;
        this.currentFilePath = filePath;
    }

    getCurrentEditor(): monaco.editor.IStandaloneCodeEditor | null {
        return this.currentEditor;
    }

    getCurrentFilePath(): string | null {
        return this.currentFilePath;
    }

    clearCurrentEditor() {
        this.currentEditor = null;
        this.currentFilePath = null;
        this.savedSelection = null;
    }

    saveCurrentSelection() {
        if (this.currentEditor) {
            const selection = this.currentEditor.getSelection();
            if (selection && !selection.isEmpty()) {
                this.savedSelection = selection;
            }
        }
    }

    private executeWithSelection(operation: () => void) {
        if (!this.currentEditor) return;

        this.saveCurrentSelection();
        
        this.currentEditor.focus();
        
        if (this.savedSelection) {
            this.currentEditor.setSelection(this.savedSelection);
        }
        
        operation();
    }

    undo() {
        this.executeWithSelection(() => {
            if (this.currentEditor) {
                this.currentEditor.trigger('keyboard', 'undo', null);
            }
        });
    }

    redo() {
        this.executeWithSelection(() => {
            if (this.currentEditor) {
                this.currentEditor.trigger('keyboard', 'redo', null);
            }
        });
    }

    cut() {
        this.executeWithSelection(() => {
            if (this.currentEditor) {
                this.currentEditor.trigger('keyboard', 'editor.action.clipboardCutAction', null);
            }
        });
    }

    copy() {
        this.executeWithSelection(() => {
            if (this.currentEditor) {
                this.currentEditor.trigger('keyboard', 'editor.action.clipboardCopyAction', null);
            }
        });
    }

    paste() {
        if (!this.currentEditor) {
            return;
        }
        
        this.currentEditor.focus();
        
        navigator.clipboard.readText().then(text => {
            if (text && this.currentEditor) {
                const selection = this.currentEditor.getSelection();
                if (selection) {
                    this.currentEditor.executeEdits('paste', [{
                        range: selection,
                        text: text,
                        forceMoveMarkers: true
                    }]);
                }
            }
        }).catch(() => {
            try {
                document.execCommand('paste');
            } catch (execError) {
            }
        });
    }

    save() {
        this.executeWithSelection(() => {
            if (!this.currentEditor || !this.currentFilePath) {
                this.saveAs();
                return;
            }
            
            const code = this.currentEditor.getValue();
            (window as any).editorAPI.writeFile(this.currentFilePath, code);
            
            window.dispatchEvent(new CustomEvent('fileSaved', {
                detail: { filePath: this.currentFilePath }
            }));
        });
    }

    saveAs() {
        this.executeWithSelection(async () => {
            try {
                const menuAPI = (window as any).menuAPI;
                if (!menuAPI) return;
                
                const filePath = await menuAPI.saveFileDialog(this.currentFilePath);
                if (!filePath) return;
                
                const code = this.currentEditor ? this.currentEditor.getValue() : '';
                await (window as any).editorAPI.writeFile(filePath, code);
                
                if (this.currentEditor) {
                    this.setCurrentEditor(this.currentEditor, filePath);
                    window.dispatchEvent(new CustomEvent('fileSaved', {
                        detail: { filePath: filePath }
                    }));
                }
                
                window.dispatchEvent(new CustomEvent('addOpenedFile', {
                    detail: { filePath: filePath }
                }));
            } catch (err) {
                console.error('Save As failed:', err);
            }
        });
    }
}

export const editorManager = new EditorManager();

export async function openInEditor(container: HTMLElement,fileDir:string) {
    let saved = true;
    const filename = fileDir.split(/[/\\]/).pop()!;
    let type = filename.split(".").pop();
    if(type === "js"){
        type="javascript";
    }else if(type === "py"){
        type="python";
    }else if(type === "ts"){
        type="typescript";
    }

    const editorHead= document.createElement("div");
    editorHead.style.position='relative';
    editorHead.style.display='flex';
    editorHead.style.width='100%';
    editorHead.style.boxSizing='border-box';
    editorHead.id='editor-head';
    const isLight = document.body.classList.contains('theme-light');
    editorHead.style.backgroundColor = isLight ? '#e8eaed' : '#212121ff';
    container.appendChild(editorHead);

    const editorHeadTitle= document.createElement("span");
    editorHeadTitle.id='editor-head-title';
    editorHeadTitle.style.position='relative';
    editorHeadTitle.style.background='none';
    editorHeadTitle.style.color = isLight ? '#5f6368' : '#fff';
    editorHeadTitle.style.marginLeft='2px';
    editorHeadTitle.style.fontSize='small';
    editorHeadTitle.textContent=filename;
    editorHead.appendChild(editorHeadTitle);

    const closeBtn=document.createElement('span');
    closeBtn.id='editor-close-btn';
    closeBtn.style.visibility='hidden';
    closeBtn.style.position='relative';
    closeBtn.style.background='none';
    closeBtn.style.cursor='pointer';
    closeBtn.style.fontSize='small';
    closeBtn.style.marginLeft='2px';
    closeBtn.textContent=' ×';
    closeBtn.style.color = isLight ? '#5f6368' : '#fff';
    closeBtn.style.borderRight = isLight ? '1px solid #dadce050' : '1px solid #ffffff50';
    editorHead.appendChild(closeBtn);
    editorHead.onmouseover=(()=>{
        closeBtn.style.visibility='visible';
    });
    editorHead.onmouseout=(()=>{
        closeBtn.style.visibility='hidden';
    });
    closeBtn.onclick=(()=>{
        if(!saved){
            window.alert("Changes not saved.");
        }else{
            editorManager.clearCurrentEditor();
            container.removeChild(editorContainer);
            container.removeChild(editorHead);
            homePage(container);
        };
    });
    const code = await (window as any).editorAPI.readFile(fileDir);
    const editorContainer = document.createElement("div");
    editorContainer.style.borderTop = isLight ? '1px solid #dadce0' : '1px solid #656565';
    editorContainer.style.width = "100%";
    editorContainer.style.height = "100%";
    editorContainer.style.position = "relative";
    editorContainer.id = 'monaco-editor-container';
    container.appendChild(editorContainer);

    const currentTheme = document.body.classList.contains('theme-light') ? 'vs' : 'vs-dark';
    
    const editor = monaco.editor.create(editorContainer, {
        value: code || "",
        language: type,
        theme: currentTheme,
        automaticLayout: true,
    });

    editorManager.setCurrentEditor(editor, fileDir);

    setTimeout(() => {
        themeManager.forceUpdateEditorTheme();
    }, 100);

    window.addEventListener('themeChanged', (event: Event) => {
        const customEvent = event as CustomEvent;
        const newTheme = customEvent.detail.theme;
        const monacoTheme = newTheme === 'light' ? 'vs' : 'vs-dark';
        console.log('Editor received theme change event:', newTheme, 'setting Monaco theme to:', monacoTheme);
        editor.updateOptions({ theme: monacoTheme });
    });

    editor.onDidChangeModelContent(() => {
        saved = false;
        closeBtn.style.fontSize='medium';
        closeBtn.style.fontWeight='bold';
        closeBtn.style.position='center';
        closeBtn.textContent='·';
    });

    editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        () => {
            saveInFile(editor,fileDir);
            closeBtn.style.fontSize='small';
            closeBtn.textContent=' ×';
            saved = true;
        }
    );

    const handleFileSaved = (event: CustomEvent) => {
        if (event.detail.filePath === fileDir) {
            saved = true;
            closeBtn.style.fontSize='small';
            closeBtn.textContent=' ×';
        }
    };
    
    window.addEventListener('fileSaved', handleFileSaved as EventListener);
    
    const originalCloseHandler = closeBtn.onclick;
    closeBtn.onclick = (event) => {
        window.removeEventListener('fileSaved', handleFileSaved as EventListener);
        if (originalCloseHandler) originalCloseHandler.call(closeBtn, event);
    };
    
    return saved;
};


export function saveInFile(editor: monaco.editor.IStandaloneCodeEditor,fileDir:string) {
    const code = editor.getValue();
    (window as any).editorAPI.writeFile(fileDir, code);
}
