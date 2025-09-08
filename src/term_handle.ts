import { Terminal } from '@xterm/xterm';
export function handleCtrlC(term:Terminal){
    const selection=term.getSelection();
    if(selection.toString()){
        navigator.clipboard.writeText(selection.toString());
    }
}
