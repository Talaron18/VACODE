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
const editor = document.getElementById("edit-window");
if (editor) {
  window.addEventListener('addOpenedFile', (e: Event) => {
    const event = e as CustomEvent<{ filePath: string }>;
    let filePath=event.detail.filePath;
    openInEditor(editor, filePath);
    const runAndDebugBtn = document.getElementById("runAndDebug");
    if (runAndDebugBtn){
      console.log("runAndDebugBtn found");
      runAndDebugBtn.addEventListener('click', () => {
        console.log("runAndDebugBtn clicked");
        console.log(filePath);
        compileAndRun(filePath);
      })
    }
  })
}

