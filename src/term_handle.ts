import { Terminal } from '@xterm/xterm';

export function handleCtrlC(term:Terminal){
    const selection=term.getSelection();
    if(selection){
        navigator.clipboard.writeText(selection).catch(e=>console.error('Failed to write to clipboard ', e));
    }else{
        window.electronAPI.sendInput('\x03');
    }
};

export async function handleCtrlV(term:Terminal) {
    try{
        const selection=await navigator.clipboard.readText();
        if(selection){
            window.electronAPI.sendInput(selection);
        }
    }catch(e){
        console.error('Failed to read clipboard ', e);
    };
};
    
