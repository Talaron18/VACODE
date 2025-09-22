"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpcHandlers = void 0;
const electron_1 = require("electron");
const file_operations_1 = require("./file-operations");
const project_manager_1 = require("./project-manager");
const ai_service_1 = require("./ai-service");
// IPC 处理器模块 - 负责处理主进程与渲染进程之间的通信
class IpcHandlers {
    constructor() {
        this.fileOperations = new file_operations_1.FileOperations();
        this.projectManager = new project_manager_1.ProjectManager();
        this.aiService = new ai_service_1.AIService();
        this.registerHandlers();
    }
    // 注册所有 IPC 处理器
    registerHandlers() {
        // 文件操作处理器
        electron_1.ipcMain.handle('create-file', async (_event, fileName, targetDir) => {
            return this.fileOperations.createFile(fileName, targetDir);
        });
        electron_1.ipcMain.handle('create-folder', async (_event, folderName, targetDir) => {
            return this.fileOperations.createFolder(folderName, targetDir);
        });
        // 项目管理处理器
        electron_1.ipcMain.handle('get-project-root', async () => {
            return this.projectManager.getBaseProjectDir();
        });
        electron_1.ipcMain.handle('list-project', async () => {
            return this.fileOperations.listProject();
        });
        electron_1.ipcMain.handle('list-directory', async (_event, dirPath) => {
            return this.fileOperations.listDirectory(dirPath);
        });
        // 获取单个文件的类型信息
        electron_1.ipcMain.handle('get-file-type', async (_event, filePath) => {
            const { FileTypeUtils } = require('./file-type-utils');
            return FileTypeUtils.getFileType(filePath);
        });
        // 对话框处理器
        electron_1.ipcMain.handle('open-file-dialog', async () => {
            const res = await electron_1.dialog.showOpenDialog({
                properties: ['openFile']
            });
            return res.canceled ? null : res.filePaths;
        });
        electron_1.ipcMain.handle('open-folder-dialog', async () => {
            const res = await electron_1.dialog.showOpenDialog({
                properties: ['openDirectory']
            });
            return res.canceled ? null : res.filePaths;
        });
        // 文件读写处理器
        electron_1.ipcMain.handle('read-file', async (_event, filePath) => {
            return this.fileOperations.readFile(filePath);
        });
        electron_1.ipcMain.handle('write-file', async (_event, filePath, content) => {
            this.fileOperations.writeFile(filePath, content);
        });
        // 文件存在性检查处理器
        electron_1.ipcMain.handle('file-exists', async (_event, filePath) => {
            return this.fileOperations.exists(filePath);
        });
        // AI聊天处理器
        electron_1.ipcMain.handle('ai-chat', async (_event, message, chatHistory = []) => {
            return this.aiService.chat(message, chatHistory);
        });
        // AI流式聊天处理器
        electron_1.ipcMain.handle('ai-chat-stream', async (event, messageId, message, chatHistory = []) => {
            try {
                for await (const chunk of this.aiService.chatStream(message, chatHistory)) {
                    event.sender.send('ai-stream-chunk', messageId, chunk);
                }
                event.sender.send('ai-stream-complete', messageId);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                event.sender.send('ai-stream-error', messageId, errorMessage);
            }
        });
        // 显示输入对话框处理器
        electron_1.ipcMain.handle('show-prompt', async (_event, title, message) => {
            const { dialog } = require('electron');
            const result = await dialog.showMessageBox({
                type: 'question',
                buttons: ['确定', '取消'],
                defaultId: 0,
                title: title,
                message: message,
                detail: '请输入你的问题'
            });
            if (result.response === 0) {
                // 用户点击了确定，返回一个简单的输入
                return '你好，请介绍一下你自己';
            }
            return null;
        });
        // 创建新窗口处理器
        electron_1.ipcMain.handle('create-new-window', async () => {
            // 创建新窗口功能已移除
            console.log('Create new window functionality removed');
        });
        // 关闭窗口处理器
        electron_1.ipcMain.handle('close-window', async (event) => {
            const window = electron_1.BrowserWindow.fromWebContents(event.sender);
            if (window) {
                window.close();
            }
        });
    }
    // 移除所有 IPC 处理器
    removeHandlers() {
        const handlers = [
            'create-file',
            'create-folder',
            'get-project-root',
            'list-project',
            'list-directory',
            'get-file-type',
            'open-file-dialog',
            'open-folder-dialog',
            'read-file',
            'write-file',
            'file-exists',
            'ai-chat',
            'show-prompt',
            'create-new-window',
            'close-window'
        ];
        handlers.forEach(handler => {
            electron_1.ipcMain.removeHandler(handler);
        });
    }
}
exports.IpcHandlers = IpcHandlers;
//# sourceMappingURL=ipc-handlers.js.map