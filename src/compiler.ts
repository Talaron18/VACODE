export function compileAndRun(fileDir: string){
    const filename = fileDir.split(/[/\\]/).pop()!;
    const extension = filename.split('.').pop()!;
    const directory = fileDir.slice(0, -filename.length);
    console.log(filename,extension,directory);
    loadExtention(extension);

    function loadExtention(extension: string){
        if (extension === 'c'){
            window.electronAPI.sendInput('cd '+directory+'; ');
            window.electronAPI.sendInput(`gcc ${filename} -o ${filename.split('.')[0]}; `);
            window.electronAPI.sendInput('.\\'+filename.split('.')[0]+'.exe');
            window.electronAPI.sendInput('\r');
        }else if(extension === 'cpp'){
            window.electronAPI.sendInput('cd '+directory+'; ');
            window.electronAPI.sendInput(`g++ ${filename} -o ${filename.split('.')[0]}; `);
            window.electronAPI.sendInput('.\\'+filename.split('.')[0]+'.exe');
            window.electronAPI.sendInput('\r');
        }else if(extension === 'py'){
            window.electronAPI.sendInput('cd '+directory+'; ');
            window.electronAPI.sendInput(`python ${filename}`);
            window.electronAPI.sendInput('\r');
        }else{
            window.alert('Unsupported file type');
        }
    }
}