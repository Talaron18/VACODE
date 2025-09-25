import { createTerminal } from "./terminal";
import { initializeAIPanel } from "./ai-init";
import { initializeMenuHandlers } from "./menu-handlers";
import { initializeMenu } from "./menu";
import { openInEditor } from "./editor";
import { compileAndRun } from "./compiler";

// 初始化终端
const terminal = document.getElementById("terminal");
if (terminal) {
  createTerminal(terminal);
}

// 初始化AI面板
const aiPanel = document.getElementById("ai-panel");
if (aiPanel) {
  initializeAIPanel();
} 

// 初始化菜单处理器（必须先初始化，因为它提供 ensureSections 方法）
const menuHandlers = document.getElementById('title_file') || document.getElementById('title_edit') || document.getElementById('title_help');
if (menuHandlers) {
  initializeMenuHandlers();
}

// 初始化菜单管理器
const explorer = document.getElementById('explorer');
if (explorer) {
  initializeMenu();
}

// 初始化编辑器
let currentFile: { path: string; saved: boolean } | null = null;
const editor = document.getElementById("edit-window");
if (editor) {
  homePage(editor);
  const cleanupEditor = () => {
    document.getElementById("home-greeting")?.remove();
    document.getElementById("home-user-guide")?.remove();
    const editorContainer = document.getElementById("monaco-editor-container");
    const editorHead = document.getElementById('editor-head');
    if (editorHead) {
      editorHead.querySelector('#editor-head-title')?.remove();
      editorHead.querySelector('#editor-close-btn')?.remove();
      editor.removeChild(editorHead);
    }
    editorContainer?.remove();
  };
  const setupRunAndDebug = () => {
    const runAndDebugBtn = document.getElementById("runAndDebug");
    if (!runAndDebugBtn) return;

    runAndDebugBtn.replaceWith(runAndDebugBtn.cloneNode(true));
    const newRunAndDebugBtn = document.getElementById("runAndDebug");
    newRunAndDebugBtn?.addEventListener("click", () => {
      if (!currentFile) {
        window.alert('No file is currently open!');
        return;
      }
      if (!currentFile.saved) {
        window.alert('Please save the file before running.');
        return;
      }
      compileAndRun(currentFile.path);
    });
  };
  window.addEventListener('addOpenedFile', async (e: Event) => {
    if (currentFile && !currentFile.saved) {
      window.alert('Please save the current file before opening a new one.');
      return;
    }

    cleanupEditor();
    const event = e as CustomEvent<{ filePath: string }>;
    const filePath = event.detail.filePath;

    currentFile = {
      path: filePath,
      saved: false,
    };

    setupRunAndDebug();

    currentFile.saved = await openInEditor(editor, filePath);
  })
};

function homePage(editor: HTMLElement) {
  const greeting=document.createElement('h1');
  greeting.id='home-greeting';
  greeting.textContent='Welcome to VACODE!';
  greeting.style.position='center';
  greeting.style.textAlign='center';
  greeting.style.marginTop='20%';
  greeting.style.fontFamily='Arial, sans-serif';
  greeting.style.fontSize='30px';
  greeting.style.color='#07b2fcce';
  const userGuide=document.createElement('a');
  userGuide.id='home-user-guide';
  userGuide.style.position='center';
  userGuide.style.textAlign='center';
  userGuide.textContent='Click here to read the User Guide.';
  userGuide.href='https://github.com/Talaron18/VACODE/blob/main/instruction.html';
  userGuide.target='_blank';
  userGuide.style.color='#07b2fcce';
  userGuide.style.marginTop='20px';
  editor.appendChild(greeting);
  editor.appendChild(userGuide);
}