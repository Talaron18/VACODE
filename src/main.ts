import * as path from'path';
import {app,BrowserWindow,ipcMain,IpcMainEvent} from 'electron';
import * as os from 'os';
import * as pty from 'node-pty';
import type{IPty} from 'node-pty';
import { IpcHandlers } from './ipc-handlers';

let ptyProcess: IPty|null=null;
let win:BrowserWindow|null=null;
let currentFile: string | null = null;

const shell = os.platform() === "win32"
  ? "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"
  : process.env.SHELL || "bash";

const createWindow=()=>{
    win=new BrowserWindow({
        width:800,
        height:600,
        minWidth:400,
        minHeight:300,
        icon:path.join(__dirname,'../static/media/icon.png'),
        titleBarStyle:'hidden',
        webPreferences:{
            nodeIntegration:false,
            contextIsolation:true,
            sandbox:true,
            preload:path.resolve(__dirname,'preload.js'),
        },
        titleBarOverlay:{
            color:'rgba(0,0,0,0)',
            symbolColor:'white',
            height:35
        }
    });
    win.loadFile(path.join(__dirname,"../index.html"))
    win.on('closed',()=>{
        if(ptyProcess){
            ptyProcess.kill();
            ptyProcess=null;
        }
        win=null;
        app.quit();
    });
    
}

app.whenReady().then(()=>{
    createWindow()
    app.on('activate',()=>{
        if(BrowserWindow.getAllWindows().length===0) createWindow()
    });

});

let ipcHandlers: IpcHandlers;
ipcHandlers = new IpcHandlers();
const ptyEnv={...process.env};
ptyEnv.Path=ptyEnv.Path+";C:\\mingw64\\bin";


ipcMain.on('terminal.create',(event:IpcMainEvent,cols?:number,rows?:number)=>{
    ptyProcess=pty.spawn(shell, ["-NoExit", "-Command", "$env:PATH='" + ptyEnv.Path + "'"],{
        name:'xterm-color',
        cols:cols,
        rows:rows,
        cwd:os.homedir(),
        env:ptyEnv,
    });

    ptyProcess?.onData((data:string)=>{
        if(win&&!win.isDestroyed()){
            event.sender.send('terminal.data',data);
        }
    });
});

ipcMain.on('terminal.toPty',(_event:IpcMainEvent,input:string)=>{
    if(ptyProcess){
        ptyProcess.write(input);
    }
});

ipcMain.on('terminal.resize',(_event:IpcMainEvent,cols:number,rows:number)=>{
    if(ptyProcess){
        ptyProcess.resize(cols,rows);
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    if (ipcHandlers) {
        ipcHandlers.removeHandlers();
    }
});