//console.log('Hello Main')
const {app,BrowserWindow}=require('electron')
const createWindow=()=>{
    const win=new BrowserWindow({
        width:800,
        height:600,
        titleBarStyle:'hidden',
        titleBarOverlay:{
            color:'rgba(0,0,0,0)',
            symbolColor:'white',
            height:35
        }
    })
    win.loadFile('index.html')
}
app.whenReady().then(()=>{
    createWindow()
    app.on('activate',()=>{
        if(BrowserWindow.getAllWindows().length===0) createWindow()
    })
})
/*
app.on('window-all-closed',()=>{
    if(process.platform!=='win32'){
        app.quit()
    }
})
*/