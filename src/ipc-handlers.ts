import { ipcMain, dialog, BrowserWindow } from 'electron';
import { FileOperations } from './file-operations';
import { ProjectManager } from './project-manager';
import { AIService } from './ai-service';

export class IpcHandlers {
    private fileOperations: FileOperations;
    private projectManager: ProjectManager;
    private aiService: AIService;

    constructor() {
        this.fileOperations = new FileOperations();
        this.projectManager = new ProjectManager();
        this.aiService = new AIService();
        this.registerHandlers();
    }

    private registerHandlers(): void {
        ipcMain.handle('create-file', async (_event: any, fileName: string, targetDir?: string): Promise<string> => {
            return this.fileOperations.createFile(fileName, targetDir);
        });

        ipcMain.handle('create-folder', async (_event: any, folderName: string, targetDir?: string): Promise<string> => {
            return this.fileOperations.createFolder(folderName, targetDir);
        });

        ipcMain.handle('get-project-root', async (): Promise<string> => {
            return this.projectManager.getBaseProjectDir();
        });

        ipcMain.handle('list-project', async (): Promise<Array<{name: string, type: string, path: string, fileType?: any}>> => {
            return this.fileOperations.listProject();
        });

        ipcMain.handle('list-directory', async (_event: any, dirPath: string): Promise<Array<{name: string, type: string, path: string, fileType?: any}>> => {
            return this.fileOperations.listDirectory(dirPath);
        });

        ipcMain.handle('get-file-type', async (_event: any, filePath: string): Promise<any> => {
            const { FileTypeUtils } = require('./file-type-utils');
            return FileTypeUtils.getFileType(filePath);
        });

        ipcMain.handle('open-file-dialog', async (): Promise<string[] | null> => {
            const res = await dialog.showOpenDialog({
                properties: ['openFile']
            });
            return res.canceled ? null : res.filePaths;
        });

        ipcMain.handle('open-folder-dialog', async (): Promise<string[] | null> => {
            const res = await dialog.showOpenDialog({
                properties: ['openDirectory']
            });
            return res.canceled ? null : res.filePaths;
        });

        ipcMain.handle('save-file-dialog', async (_event: any, currentFilePath?: string): Promise<string | null> => {
            
            const res = await dialog.showSaveDialog({
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

        ipcMain.handle('read-file', async (_event: any, filePath: string): Promise<string> => {
            return this.fileOperations.readFile(filePath);
        });

        ipcMain.handle('write-file', async (_event: any, filePath: string, content: string): Promise<void> => {
            this.fileOperations.writeFile(filePath, content);
        });

        ipcMain.handle('file-exists', async (_event: any, filePath: string): Promise<boolean> => {
            return this.fileOperations.exists(filePath);
        });

        ipcMain.handle('ai-chat', async (_event: any, message: string, chatHistory: any[] = []): Promise<string> => {
            return this.aiService.chat(message, chatHistory);
        });

        ipcMain.handle('ai-chat-stream', async (event: any, messageId: string, message: string, chatHistory: any[] = []): Promise<void> => {
            try {
                for await (const chunk of this.aiService.chatStream(message, chatHistory)) {
                    event.sender.send('ai-stream-chunk', messageId, chunk);
                }
                event.sender.send('ai-stream-complete', messageId);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                event.sender.send('ai-stream-error', messageId, errorMessage);
            }
        });

        ipcMain.handle('show-prompt', async (_event: any, title: string, message: string): Promise<string | null> => {
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

        ipcMain.handle('create-new-window', async (): Promise<void> => {
            const { createWindow } = require('./main');
            createWindow();
        });

        ipcMain.handle('close-window', async (event: any): Promise<void> => {
            const window = BrowserWindow.fromWebContents(event.sender);
            if (window) {
                window.close();
            }
        });
    }

    public removeHandlers(): void {
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
            ipcMain.removeHandler(handler);
        });
    }
}
