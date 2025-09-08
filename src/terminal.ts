
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";

const root=process.cwd();
const term_container=document.getElementById("term_container");
const term_header=document.getElementById("term_header");
const edit_window=document.getElementById("edit-window");
const term_size=document.getElementById("terminal");

let input=-1;

const term = new Terminal({
    cursorBlink: true,
    screenReaderMode:false,
    convertEol:true,
    scrollback:5,
});
console.log(term.rows);
console.log(term.cols);
const fitAddon = new FitAddon();
term.loadAddon(fitAddon);
term.open(document.getElementById("terminal"));
term.scrollLines(2);

fitAddon.fit();
window.electronAPI.resize(term.rows,term.cols);
function initiateTerminal(){
    term.write(root+" $ ");
}
function prompt(){
    term.write('\r\n$ ');
}
//console.log(input);
initiateTerminal();
term.onKey(({ key, domEvent }) => {
    const printable=!domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;
    
    if (domEvent.key === 'Enter') {
        prompt();
        input=-1;
    } else if (domEvent.key === 'Backspace') {
        if(input>-1){
            term.write('\b \b');
            input--;
        }  
    } else if (domEvent.key=== 'Delete'){
        if(input>-1){
            term.write(' \b\b');
            input--;
            if(input===-1){
                term.write(' \b');
            }
        }
    } else if (domEvent.key === 'ArrowLeft') {
        //input--;
    } else if(domEvent.key === 'ArrowRight'){
        //input++;
    } else if(domEvent.key === 'ArrowUp'){
        domEvent.preventDefault();
        return;
    } else if(domEvent.key === 'ArrowDown'){
        domEvent.preventDefault();
        return;
    } else if(printable) {
        input++;
        term.write(key);
    }
    //console.log(input);
});

window.addEventListener("resize", () => {
    fitAddon.fit();
    window.electronAPI.resize(term.rows,term.cols)
});

let isResizing=false;
term_header.addEventListener("mousedown",()=>{
    isResizing=true;
    document.body.style.cursor='ns-resize';
    console.log("mousedown detected");
});

window.addEventListener("mousemove",(e)=>{
    if(!isResizing) return;
    const newHeight=window.innerHeight - e.clientY;
    term_container.style.height=newHeight+"px";
    fitAddon.fit();
});

window.addEventListener("mouseup",()=>{
    if(isResizing){
        isResizing=false;
        console.log("mouseup detected");
        document.body.style.cursor='default';
    }
});

const toggleBtn=document.getElementById('ter');
let isVisible=true;
toggleBtn.addEventListener("click",()=>{
    console.log("toggleBtn clicked");
    if(isVisible){
        term_container.style.height='20px';
        edit_window.style.height='100%';
    }else{
        term_container.style.height='43%';
    }
    isVisible=!isVisible;
});

term.onResize(size =>{
    window.electronAPI.resize(size.rows,size.cols);
})