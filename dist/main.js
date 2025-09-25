"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWindow = void 0;
const path = __importStar(require("path"));
const electron_1 = require("electron");
const os = __importStar(require("os"));
const pty = __importStar(require("node-pty"));
const ipc_handlers_1 = require("./ipc-handlers");
let ptyProcesses = new Map();
let win = null;
let currentFile = null;
const shell = os.platform() === "win32"
    ? "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"
    : process.env.SHELL || "bash";
const createWindow = () => {
    const newWin = new electron_1.BrowserWindow({
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
    newWin.loadFile(path.join(__dirname, "../index.html"));
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
        }
        catch (error) {
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
};
exports.createWindow = createWindow;
electron_1.app.whenReady().then(() => {
    (0, exports.createWindow)();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            (0, exports.createWindow)();
    });
});
let ipcHandlers;
ipcHandlers = new ipc_handlers_1.IpcHandlers();
const ptyEnv = { ...process.env };
ptyEnv.Path = (ptyEnv.Path || '') + ";C:\\mingw64\\bin";
electron_1.ipcMain.on('terminal.create', (event, cols, rows) => {
    const windowId = event.sender.id;
    const ptyProcess = pty.spawn(shell, ["-NoExit", "-Command", "$env:PATH='" + ptyEnv.Path + "'"], {
        name: 'xterm-color',
        cols: cols,
        rows: rows,
        cwd: os.homedir(),
        env: ptyEnv,
    });
    ptyProcesses.set(windowId, ptyProcess);
    const onData = (data) => {
        if (win && !win.isDestroyed()) {
            event.sender.send('terminal.data', data);
        }
    };
    const dispose = ptyProcess.onData(onData);
    const window = electron_1.BrowserWindow.fromWebContents(event.sender);
    if (window) {
        window.on('close', () => {
            dispose.dispose();
            ptyProcess.kill();
            ptyProcesses.delete(windowId);
        });
    }
});
electron_1.ipcMain.on('terminal.toPty', (event, input) => {
    const windowId = event.sender.id;
    const ptyProcess = ptyProcesses.get(windowId);
    if (ptyProcess) {
        ptyProcess.write(input);
    }
});
electron_1.ipcMain.on('terminal.resize', (event, cols, rows) => {
    const windowId = event.sender.id;
    const ptyProcess = ptyProcesses.get(windowId);
    if (ptyProcess) {
        ptyProcess.resize(cols, rows);
    }
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('before-quit', () => {
    ptyProcesses.forEach((ptyProcess) => {
        ptyProcess.kill();
    });
    ptyProcesses.clear();
    if (ipcHandlers) {
        ipcHandlers.removeHandlers();
    }
});
//# sourceMappingURL=main.js.map