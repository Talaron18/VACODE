
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { handleCtrlC, handleCtrlV } from "./term_handle";

export function createTerminal(container: HTMLElement){
    const term_container = document.getElementById("term_container")!;
    const term_header = document.getElementById("term_header")!;
    const edit_window = document.getElementById("edit-window")!;
    const toggleBtn = document.getElementById('ter')!;
    let isVisible = false;
    const fitAddon = new FitAddon();
    
    let term = new Terminal({
        cursorBlink: true,
        fontSize: 16,
        fontFamily: 'Consolas, "Courier New", monospace',
        scrollback: 1000, // 增加滚动缓冲区
        allowTransparency: false, // 禁用透明度
        theme: {
            background: '#000000',
            foreground: '#ffffff'
        }
    });
    
    term.loadAddon(fitAddon);
    term.open(container);
    
    // 初始化终端
    const initTerminal = () => {
        fitAddon.fit();
        const dim = fitAddon.proposeDimensions();
        if(dim){
            (window as any).electronAPI.createTerminal(dim.cols, dim.rows);
        }
    };
    
    requestAnimationFrame(initTerminal);

    term.onData((data) => {
        (window as any).electronAPI.sendInput(data);
    });

    (window as any).electronAPI.onData((data: string) => {
        term.write(data);
    });

    const resizeTerminal = () => {
        fitAddon.fit();
        const dim = fitAddon.proposeDimensions();
        if(dim && dim.cols > 0 && dim.rows > 0){
            (window as any).electronAPI.resize(dim.cols, dim.rows);
        }
    };


    const adjustTerminalPosition = () => {
        const contentArea = document.querySelector('.content') as HTMLElement;
        if (contentArea && term_container) {
            const contentMarginLeft = contentArea.style.marginLeft;
            
            if (contentMarginLeft) {
                // 解析margin-left值，提取数字部分
                const marginValue = parseInt(contentMarginLeft);
                
                //term_container.style.left = marginValue + 'px';
                term_container.style.width = `calc(100% - ${marginValue}px)`;
                edit_window.style.width = `calc(100% - ${marginValue}px)`;
            } else {
                // 默认位置
                //term_container.style.left = '60px';
                term_container.style.width = 'calc(100% - 45px)';
                edit_window.style.width = 'calc(100% - 45px)';
            }
            // 立即调整终端尺寸，无延迟
            resizeTerminal();
        }
    };

    (window as any).adjustTerminalPosition = adjustTerminalPosition;

    // 窗口大小调整 - 使用防抖优化
    let resizeTimeout: NodeJS.Timeout;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resizeTerminal, 150);
    });

    // 拖拽调整终端高度
    let isResizing = false;
    term_header.addEventListener("mousedown", () => {
        isResizing = true;
        document.body.style.cursor = 'ns-resize';
    });

    window.addEventListener("mousemove", (e) => {
        if(!isResizing) return;
        const newHeight = window.innerHeight - e.clientY;
        term_container.style.height = newHeight + "px";
        let terminalHeight=term_container.style.height;
        let terminalHeightValue=parseInt(terminalHeight);
        edit_window.style.height=`calc(93% - ${terminalHeightValue}px)`;
    });

    window.addEventListener("mouseup", () => {
        if(isResizing){
            isResizing = false;
            document.body.style.cursor = 'default';
            resizeTerminal();
        }
    });

    // 键盘快捷键
    term.attachCustomKeyEventHandler((event: KeyboardEvent) => {
        if(event.ctrlKey && event.key === 'c'){
            handleCtrlC(term);
            return false;
        }else if(event.ctrlKey && event.key === 'v'){
            handleCtrlV(term);
            return false;
        }
        return true;
    });

    toggleBtn.addEventListener("click", () => {
        if(isVisible){
            term_container.style.height = '20px';
            edit_window.style.height = '100%';
        }else{
            term_container.style.height = '43%';
            resizeTerminal();
        }
        isVisible = !isVisible;
    });
}