
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
    
    const getTerminalTheme = () => {
        const isLight = document.body.classList.contains('theme-light');
        return {
            background: isLight ? '#ffffff' : '#000000',
            foreground: isLight ? '#000000' : '#ffffff'
        };
    };

    let term = new Terminal({
        cursorBlink: true,
        fontSize: 16,
        fontFamily: 'Consolas, "Courier New", monospace',
        scrollback: 1000,
        allowTransparency: false,
        theme: getTerminalTheme()
    });
    
    term.loadAddon(fitAddon);
    term.open(container);
    
    const initTerminal = () => {
        fitAddon.fit();
        const dim = fitAddon.proposeDimensions();
        if(dim){
            (window as any).electronAPI.createTerminal(dim.cols, dim.rows);
        }
    };
    
    requestAnimationFrame(() => {
        initTerminal();
        adjustTerminalPosition();
    });

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


    const adjustTerminalPosition = (shouldResize = true) => {
        const contentArea = document.querySelector('.content') as HTMLElement;
        const editTermContainer = document.querySelector('.edit-term-container') as HTMLElement;
        
        if (contentArea && term_container) {

            const marginLeft = contentArea.style.marginLeft || '60px';
            const marginValue = parseInt(marginLeft.replace('px', ''));
 
            term_container.style.left = `${marginValue}px`;
            term_container.style.width = `calc(100% - ${marginValue}px)`;
            term_container.style.right = '0px';

            if (editTermContainer) {
                const currentWidth = editTermContainer.style.width;
                if (!currentWidth || currentWidth === 'calc(100% - 4px)') {
                    editTermContainer.style.width = `calc(100% - ${marginValue}px)`;
                }
            }
            

            if (shouldResize) {
                resizeTerminal();
            }
        }
    };

    (window as any).adjustTerminalPosition = adjustTerminalPosition;

    let resizeTimeout: NodeJS.Timeout;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            resizeTerminal();
            adjustTerminalPosition();
        }, 100);
    });

    let isResizing = false;
    term_header.addEventListener("mousedown", () => {
        isResizing = true;
        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';

        const contentArea = document.querySelector('.content') as HTMLElement;
        if (contentArea) {
            contentArea.classList.add('resizing');
        }
    });

    window.addEventListener("mousemove", (e) => {
        if(!isResizing) return;
        const newHeight = window.innerHeight - e.clientY - 36;
        const minHeight = 100; 
        const maxHeight = window.innerHeight * 0.8; 
        
        const clampedHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
        const heightPercent = (clampedHeight / (window.innerHeight - 36)) * 100;
        
        term_container.style.height = heightPercent + "%";
        edit_window.style.height = (96 - heightPercent) + "%";
        
    });

    window.addEventListener("mouseup", () => {
        if(isResizing){
            isResizing = false;
            document.body.style.cursor = 'default';
            document.body.style.userSelect = '';
            const contentArea = document.querySelector('.content') as HTMLElement;
            if (contentArea) {
                contentArea.classList.remove('resizing');
            }
            resizeTerminal();
        }
    });

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
            term_container.style.display = 'none';
            edit_window.style.height='100%';
        }else{
            term_container.style.display = 'flex';
            edit_window.style.height='51%';
            term_container.style.height='45%';
            resizeTerminal();
        }
        isVisible = !isVisible;
    });

    window.addEventListener('themeChanged', (event: Event) => {
        const customEvent = event as CustomEvent;
        const newTheme = customEvent.detail.theme;
        const theme = newTheme === 'light' ? {
            background: '#ffffff',
            foreground: '#000000'
        } : {
            background: '#000000',
            foreground: '#ffffff'
        };
        term.options.theme = theme;
    });
}