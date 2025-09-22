"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    createTerminal: (cols, rows) => electron_1.ipcRenderer.send('terminal.create', cols, rows),
    sendInput: (input) => electron_1.ipcRenderer.send('terminal.toPty', input),
    resize: (cols, rows) => electron_1.ipcRenderer.send('terminal.resize', cols, rows),
    onData: (callback) => {
        electron_1.ipcRenderer.on('terminal.data', (_event, data) => callback(data));
    },
});
electron_1.contextBridge.exposeInMainWorld('menuAPI', {
    getProjectRoot: () => electron_1.ipcRenderer.invoke('get-project-root'),
    createFile: (name, dir) => electron_1.ipcRenderer.invoke('create-file', name, dir),
    createFolder: (name, dir) => electron_1.ipcRenderer.invoke('create-folder', name, dir),
    listDirectory: (folderPath) => electron_1.ipcRenderer.invoke('list-directory', folderPath),
    openFileDialog: () => electron_1.ipcRenderer.invoke('open-file-dialog'),
    openFolderDialog: () => electron_1.ipcRenderer.invoke('open-folder-dialog'),
    createNewWindow: () => electron_1.ipcRenderer.invoke('create-new-window'),
    closeWindow: () => electron_1.ipcRenderer.invoke('close-window'),
    getFileType: (filePath) => electron_1.ipcRenderer.invoke('get-file-type', filePath),
});
electron_1.contextBridge.exposeInMainWorld('editorAPI', {
    readFile: async (filePath) => {
        return await electron_1.ipcRenderer.invoke('read-file', filePath);
    },
    writeFile: async (filePath, content) => {
        return await electron_1.ipcRenderer.invoke('write-file', filePath, content);
    }
});
electron_1.contextBridge.exposeInMainWorld('aiAPI', {
    chat: (message, chatHistory = []) => electron_1.ipcRenderer.invoke('ai-chat', message, chatHistory),
    chatStream: (message, chatHistory = []) => {
        return new Promise((resolve, reject) => {
            const messageId = Date.now().toString();
            const chunks = [];
            const handleChunk = (event, id, chunk) => {
                if (id === messageId)
                    chunks.push(chunk);
            };
            const handleComplete = (event, id) => {
                if (id === messageId) {
                    electron_1.ipcRenderer.removeListener('ai-stream-chunk', handleChunk);
                    electron_1.ipcRenderer.removeListener('ai-stream-complete', handleComplete);
                    electron_1.ipcRenderer.removeListener('ai-stream-error', handleError);
                    resolve(chunks.join(''));
                }
            };
            const handleError = (event, id, err) => {
                if (id === messageId) {
                    electron_1.ipcRenderer.removeListener('ai-stream-chunk', handleChunk);
                    electron_1.ipcRenderer.removeListener('ai-stream-complete', handleComplete);
                    electron_1.ipcRenderer.removeListener('ai-stream-error', handleError);
                    reject(new Error(err));
                }
            };
            electron_1.ipcRenderer.on('ai-stream-chunk', handleChunk);
            electron_1.ipcRenderer.on('ai-stream-complete', handleComplete);
            electron_1.ipcRenderer.on('ai-stream-error', handleError);
            electron_1.ipcRenderer.invoke('ai-chat-stream', messageId, message, chatHistory);
        });
    }
});
//# sourceMappingURL=preload.js.map