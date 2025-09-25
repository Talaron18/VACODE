import { createTerminal } from "./terminal";
import { initializeAIPanel } from "./ai-init";
import { initializeMenuHandlers } from "./menu-handlers";
import { initializeMenu } from "./menu";
import { openInEditor } from "./editor";
import { compileAndRun } from "./compiler";
import { initializeThemeManager } from "./theme-manager";
import { homePage } from "./home-page";

const terminal = document.getElementById("terminal");
if (terminal) {
  createTerminal(terminal);
}

const aiPanel = document.getElementById("ai-panel");
if (aiPanel) {
  initializeAIPanel();
} 

const menuHandlers = document.getElementById('title_file') || document.getElementById('title_edit') || document.getElementById('title_help');
if (menuHandlers) {
  initializeMenuHandlers();
}

const explorer = document.getElementById('explorer');
if (explorer) {
  initializeMenu();
}

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

const themeManager = document.getElementById('title_view');
if (themeManager) {
  initializeThemeManager();
}