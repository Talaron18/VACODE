import{contextBridge,ipcRenderer} from 'electron';

contextBridge.exposeInMainWorld('electronAPI',{
    createTerminal:(cols:number,rows:number)=>ipcRenderer.send('terminal.create',cols,rows),
    sendInput:(input:string)=>ipcRenderer.send('terminal.toPty',input),
    resize:(cols:number,rows:number)=>ipcRenderer.send('terminal.resize',cols,rows),
    onData:(callback:(data:string)=>void)=>{
        ipcRenderer.on('terminal.data',(_event,data:string)=>callback(data));
    },
});

contextBridge.exposeInMainWorld('menuAPI', {
    getProjectRoot: () => ipcRenderer.invoke('get-project-root'),
    createFile: (name: string, dir: string) => ipcRenderer.invoke('create-file', name, dir),
    createFolder: (name: string, dir: string) => ipcRenderer.invoke('create-folder', name, dir),
    listDirectory: (folderPath: string) => ipcRenderer.invoke('list-directory', folderPath),
    openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
    openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
    createNewWindow: () => ipcRenderer.invoke('create-new-window'),
    closeWindow: () => ipcRenderer.invoke('close-window'),
    getFileType: (filePath: string) => ipcRenderer.invoke('get-file-type', filePath),
});

contextBridge.exposeInMainWorld('editorAPI',{
    readFile:async (filePath:string)=>{
        return await ipcRenderer.invoke('read-file',filePath);
    },
    writeFile:async (filePath:string,content:string)=>{
        return await ipcRenderer.invoke('write-file',filePath,content)
    }
});

contextBridge.exposeInMainWorld('aiAPI', {
    chat: (message: string, chatHistory: any[] = []) => ipcRenderer.invoke('ai-chat', message, chatHistory),
    chatStream: (message: string, chatHistory: any[] = []) => {
        return new Promise((resolve, reject) => {
            const messageId = Date.now().toString();
            const chunks: string[] = [];
            
            const handleChunk = (event: any, id: string, chunk: string) => {
                if (id === messageId) chunks.push(chunk);
            };
            
            const handleComplete = (event: any, id: string) => {
                if (id === messageId) {
                    ipcRenderer.removeListener('ai-stream-chunk', handleChunk);
                    ipcRenderer.removeListener('ai-stream-complete', handleComplete);
                    ipcRenderer.removeListener('ai-stream-error', handleError);
                    resolve(chunks.join(''));
                }
            };
            
            const handleError = (event: any, id: string, err: string) => {
                if (id === messageId) {
                    ipcRenderer.removeListener('ai-stream-chunk', handleChunk);
                    ipcRenderer.removeListener('ai-stream-complete', handleComplete);
                    ipcRenderer.removeListener('ai-stream-error', handleError);
                    reject(new Error(err));
                }
            };
            
            ipcRenderer.on('ai-stream-chunk', handleChunk);
            ipcRenderer.on('ai-stream-complete', handleComplete);
            ipcRenderer.on('ai-stream-error', handleError);
            
            ipcRenderer.invoke('ai-chat-stream', messageId, message, chatHistory);
        });
    }
});
