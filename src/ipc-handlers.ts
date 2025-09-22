import { ipcMain, dialog, BrowserWindow } from 'electron';
import { FileOperations } from './file-operations';
import { ProjectManager } from './project-manager';
import { AIService } from './ai-service';

// IPC 处理器模块 - 负责处理主进程与渲染进程之间的通信
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

    // 注册所有 IPC 处理器
    private registerHandlers(): void {
        // 文件操作处理器
        ipcMain.handle('create-file', async (_event: any, fileName: string, targetDir?: string): Promise<string> => {
            return this.fileOperations.createFile(fileName, targetDir);
        });

        ipcMain.handle('create-folder', async (_event: any, folderName: string, targetDir?: string): Promise<string> => {
            return this.fileOperations.createFolder(folderName, targetDir);
        });

        // 项目管理处理器
        ipcMain.handle('get-project-root', async (): Promise<string> => {
            return this.projectManager.getBaseProjectDir();
        });

        ipcMain.handle('list-project', async (): Promise<Array<{name: string, type: string, path: string, fileType?: any}>> => {
            return this.fileOperations.listProject();
        });

        ipcMain.handle('list-directory', async (_event: any, dirPath: string): Promise<Array<{name: string, type: string, path: string, fileType?: any}>> => {
            return this.fileOperations.listDirectory(dirPath);
        });

        // 获取单个文件的类型信息
        ipcMain.handle('get-file-type', async (_event: any, filePath: string): Promise<any> => {
            const { FileTypeUtils } = require('./file-type-utils');
            return FileTypeUtils.getFileType(filePath);
        });

        // 对话框处理器
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

        // 文件读写处理器
        ipcMain.handle('read-file', async (_event: any, filePath: string): Promise<string> => {
            return this.fileOperations.readFile(filePath);
        });

        ipcMain.handle('write-file', async (_event: any, filePath: string, content: string): Promise<void> => {
            this.fileOperations.writeFile(filePath, content);
        });

        // 文件存在性检查处理器
        ipcMain.handle('file-exists', async (_event: any, filePath: string): Promise<boolean> => {
            return this.fileOperations.exists(filePath);
        });

        // AI聊天处理器
        ipcMain.handle('ai-chat', async (_event: any, message: string, chatHistory: any[] = []): Promise<string> => {
            return this.aiService.chat(message, chatHistory);
        });

        // AI流式聊天处理器
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

        // 显示输入对话框处理器
        ipcMain.handle('show-prompt', async (_event: any, title: string, message: string): Promise<string | null> => {
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
        ipcMain.handle('create-new-window', async (): Promise<void> => {
            // 创建新窗口功能已移除
            console.log('Create new window functionality removed');
        });

        // 关闭窗口处理器
        ipcMain.handle('close-window', async (event: any): Promise<void> => {
            const window = BrowserWindow.fromWebContents(event.sender);
            if (window) {
                window.close();
            }
        });
    }

    // 移除所有 IPC 处理器
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
