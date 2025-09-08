const path=require('path')
const {app,BrowserWindow,ipcMain}=require('electron')
import * as os from 'os';
import * as pty from 'node-pty';

let ptyProcess;
const shell=os.platform()=='win32'?'powershell.exe':'bash';
const createWindow=()=>{
    const win=new BrowserWindow({
        width:800,
        height:600,
        titleBarStyle:'hidden',
        webPreferences:{
            nodeIntegration:true,
            contextIsolation:false,
            preload:path.join(__dirname,'/preload.js'),
        },
        titleBarOverlay:{
            color:'rgba(0,0,0,0)',
            symbolColor:'white',
            height:35
        }
    });
    win.loadFile('../index.html')
}
app.whenReady().then(()=>{
    createWindow()
    app.on('activate',()=>{
        if(BrowserWindow.getAllWindows().length===0) createWindow()
    })
    ipcMain.on('terminal.create',(event)=>{
        ptyProcess=pty.spawn(shell,[],{
            name:'xterm-color',
            cols:80,
            rows:30,
            cwd:process.env.HOME,
            env:process.env
        })
    })
})

