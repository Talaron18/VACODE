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
const path = __importStar(require("path"));
const electron_1 = require("electron");
const os = __importStar(require("os"));
const pty = __importStar(require("node-pty"));
const ipc_handlers_1 = require("./ipc-handlers");
let ptyProcess = null;
let win = null;
let currentFile = null;
const shell = os.platform() === "win32"
    ? "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"
    : process.env.SHELL || "bash";
const createWindow = () => {
    win = new electron_1.BrowserWindow({
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
    win.loadFile(path.join(__dirname, "../index.html"));
    win.on('closed', () => {
        if (ptyProcess) {
            ptyProcess.kill();
            ptyProcess = null;
        }
        win = null;
        electron_1.app.quit();
    });
};
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
let ipcHandlers;
ipcHandlers = new ipc_handlers_1.IpcHandlers();
const ptyEnv = { ...process.env };
ptyEnv.Path = ptyEnv.Path + ";C:\\mingw64\\bin";
electron_1.ipcMain.on('terminal.create', (event, cols, rows) => {
    ptyProcess = pty.spawn(shell, ["-NoExit", "-Command", "$env:PATH='" + ptyEnv.Path + "'"], {
        name: 'xterm-color',
        cols: cols,
        rows: rows,
        cwd: os.homedir(),
        env: ptyEnv,
    });
    ptyProcess?.onData((data) => {
        if (win && !win.isDestroyed()) {
            event.sender.send('terminal.data', data);
        }
    });
});
electron_1.ipcMain.on('terminal.toPty', (_event, input) => {
    if (ptyProcess) {
        ptyProcess.write(input);
    }
});
electron_1.ipcMain.on('terminal.resize', (_event, cols, rows) => {
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
    if (ipcHandlers) {
        ipcHandlers.removeHandlers();
    }
});
//# sourceMappingURL=main.js.map