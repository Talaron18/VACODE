"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpcHandlers = void 0;
const electron_1 = require("electron");
const file_operations_1 = require("./file-operations");
const project_manager_1 = require("./project-manager");
const ai_service_1 = require("./ai-service");
class IpcHandlers {
    constructor() {
        this.fileOperations = new file_operations_1.FileOperations();
        this.projectManager = new project_manager_1.ProjectManager();
        this.aiService = new ai_service_1.AIService();
        this.registerHandlers();
    }
    registerHandlers() {
        electron_1.ipcMain.handle('create-file', async (_event, fileName, targetDir) => {
            return this.fileOperations.createFile(fileName, targetDir);
        });
        electron_1.ipcMain.handle('create-folder', async (_event, folderName, targetDir) => {
            return this.fileOperations.createFolder(folderName, targetDir);
        });
        electron_1.ipcMain.handle('get-project-root', async () => {
            return this.projectManager.getBaseProjectDir();
        });
        electron_1.ipcMain.handle('list-project', async () => {
            return this.fileOperations.listProject();
        });
        electron_1.ipcMain.handle('list-directory', async (_event, dirPath) => {
            return this.fileOperations.listDirectory(dirPath);
        });
        electron_1.ipcMain.handle('get-file-type', async (_event, filePath) => {
            const { FileTypeUtils } = require('./file-type-utils');
            return FileTypeUtils.getFileType(filePath);
        });
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
        electron_1.ipcMain.handle('save-file-dialog', async (_event, currentFilePath) => {
            const res = await electron_1.dialog.showSaveDialog({
                properties: ['createDirectory'],
                defaultPath: currentFilePath ? currentFilePath.replace(/\\/g, '/') : undefined,
                filters: [
                    { name: 'All Files', extensions: ['*'] },
                    { name: 'C Files', extensions: ['c'] },
                    { name: 'C++ Files', extensions: ['cpp', 'cc', 'cxx'] },
                    { name: 'JavaScript', extensions: ['js'] },
                    { name: 'TypeScript', extensions: ['ts'] },
                    { name: 'Python', extensions: ['py'] },
                    { name: 'HTML', extensions: ['html', 'htm'] },
                    { name: 'CSS', extensions: ['css'] },
                    { name: 'JSON', extensions: ['json'] },
                    { name: 'Markdown', extensions: ['md'] },
                    { name: 'Text Files', extensions: ['txt'] }
                ]
            });
            return res.canceled ? null : res.filePath || null;
        });
        electron_1.ipcMain.handle('read-file', async (_event, filePath) => {
            return this.fileOperations.readFile(filePath);
        });
        electron_1.ipcMain.handle('write-file', async (_event, filePath, content) => {
            this.fileOperations.writeFile(filePath, content);
        });
        electron_1.ipcMain.handle('file-exists', async (_event, filePath) => {
            return this.fileOperations.exists(filePath);
        });
        electron_1.ipcMain.handle('ai-chat', async (_event, message, chatHistory = []) => {
            return this.aiService.chat(message, chatHistory);
        });
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
        electron_1.ipcMain.handle('show-prompt', async (_event, title, message) => {
            const { dialog } = require('electron');
            const result = await dialog.showMessageBox({
                type: 'question',
                buttons: ['OK', 'Cancel'],
                defaultId: 0,
                title: title,
                message: message,
                detail: 'Please enter your question'
            });
            if (result.response === 0) {
                return 'Hello, please introduce yourself';
            }
            return null;
        });
        electron_1.ipcMain.handle('create-new-window', async () => {
            const { createWindow } = require('./main');
            createWindow();
        });
        electron_1.ipcMain.handle('close-window', async (event) => {
            const window = electron_1.BrowserWindow.fromWebContents(event.sender);
            if (window) {
                window.close();
            }
        });
    }
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
            'save-file-dialog',
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