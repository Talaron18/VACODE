import * as path from 'path';
import {app,BrowserWindow,ipcMain,IpcMainEvent} from 'electron';
import * as os from 'os';
import * as pty from 'node-pty';
import type {IPty} from 'node-pty';
import { IpcHandlers } from './ipc-handlers';

let ptyProcesses: Map<number, IPty> = new Map();
let win: BrowserWindow | null = null;
let currentFile: string | null = null;

const shell = os.platform() === "win32"
  ? "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"
  : process.env.SHELL || "bash";

export const createWindow = () => {
    const newWin = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 400,
        minHeight: 300,
        icon: path.join(__dirname, '../static/media/icon.png'),
        titleBarStyle: 'hidden',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            preload: path.resolve(__dirname, 'preload.js'),
        },
        titleBarOverlay: {
            color: 'rgba(0,0,0,0)',
            symbolColor: 'white',
            height: 35
        }
    });
    newWin.loadFile(path.join(__dirname, "../index.html"))
    newWin.on('closed', () => {
        try {
            if (!newWin.isDestroyed()) {
                const windowId = newWin.webContents.id;
                const ptyProcess = ptyProcesses.get(windowId);
                if (ptyProcess) {
                    ptyProcess.kill();
                    ptyProcesses.delete(windowId);
                }
            }
        } catch (error) {
            console.warn('Error cleaning up window resources:', error);
        }
        
        if (win === newWin) {
            win = null;
        }
    });
    
    if (!win) {
        win = newWin;
    }
    
    return newWin;
}

app.whenReady().then(() => {
    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    });

});

let ipcHandlers: IpcHandlers;
ipcHandlers = new IpcHandlers();
const ptyEnv = {...process.env};
ptyEnv.Path = (ptyEnv.Path || '') + ";C:\\mingw64\\bin";


ipcMain.on('terminal.create', (event: IpcMainEvent, cols?: number, rows?: number) => {
    const windowId = event.sender.id;
    const ptyProcess = pty.spawn(shell, ["-NoExit", "-Command", "$env:PATH='" + ptyEnv.Path + "'"], {
        name: 'xterm-color',
        cols: cols,
        rows: rows,
        cwd: os.homedir(),
        env: ptyEnv,
    });

    ptyProcesses.set(windowId, ptyProcess);

    const onData=(data: string) => {
        if (win && !win.isDestroyed()) {
            event.sender.send('terminal.data', data);
        }
    };
    const dispose=ptyProcess.onData(onData);
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
        window.on('close', () => {
            dispose.dispose();
            ptyProcess.kill();
            ptyProcesses.delete(windowId);
        });
    }
});

ipcMain.on('terminal.toPty', (event: IpcMainEvent, input: string) => {
    const windowId = event.sender.id;
    const ptyProcess = ptyProcesses.get(windowId);
    if (ptyProcess) {
        ptyProcess.write(input);
    }
});

ipcMain.on('terminal.resize', (event: IpcMainEvent, cols: number, rows: number) => {
    const windowId = event.sender.id;
    const ptyProcess = ptyProcesses.get(windowId);
    if (ptyProcess) {
        ptyProcess.resize(cols, rows);
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    ptyProcesses.forEach((ptyProcess) => {
        ptyProcess.kill();
    });
    ptyProcesses.clear();
    
    if (ipcHandlers) {
        ipcHandlers.removeHandlers();
    }
});