// Menu functionality for VACode
document.addEventListener('DOMContentLoaded', function() {
    const { ipcRenderer } = require('electron');
    // Get menu elements
    const fileMenuTrigger = document.getElementById('title_file');
    const editMenuTrigger = document.getElementById('title_edit');
    const fileDropdown = document.getElementById('file-dropdown');
    const editDropdown = document.getElementById('edit-dropdown');
    const helpMenuTrigger = document.getElementById('title_help');
    const helpDropdown = document.getElementById('help-dropdown');
    // Explorer elements
    const explorerTrigger = document.getElementById('explorer-trigger');
    const explorerPanel = document.getElementById('explorer-panel');
    const contentArea = document.querySelector('.content');
    const explorerResizeHandle = document.getElementById('explorer-resize-handle');
    const newFileBtn = document.getElementById('new-file-btn');
    const newFolderBtn = document.getElementById('new-folder-btn');
    const explorerContent = document.querySelector('.explorer-content');

    // Track state
    let currentExplorerRoot = null; // folder currently displayed in folder section
    let openedFiles = []; // list of opened file paths

    // Ensure two sections inside explorer content
    function ensureSections() {
        if (!explorerContent) return {};
        let openEditorsSection = explorerContent.querySelector('#open-editors-section');
        let folderSection = explorerContent.querySelector('#folder-section');
        if (!openEditorsSection) {
            openEditorsSection = document.createElement('div');
            openEditorsSection.id = 'open-editors-section';
            explorerContent.appendChild(openEditorsSection);
        }
        if (!folderSection) {
            const divider = document.createElement('div');
            divider.style.height = '8px';
            divider.style.opacity = '0';
            explorerContent.appendChild(divider);
            folderSection = document.createElement('div');
            folderSection.id = 'folder-section';
            explorerContent.appendChild(folderSection);
        }
        return { openEditorsSection, folderSection };
    }

    // ----- Helper UI builders -----
    function makeCloseButton(onClick){
        const btn = document.createElement('span');
        btn.textContent = '×';
        btn.style.marginLeft = '8px';
        btn.style.color = '#bdbdbd';
        btn.style.cursor = 'pointer';
        btn.onmouseenter = () => btn.style.color = '#ffffff';
        btn.onmouseleave = () => btn.style.color = '#bdbdbd';
        btn.addEventListener('click', (e)=>{ e.stopPropagation(); onClick(); });
        return btn;
    }

    // ----- Render: Opened Files (independent section) -----
    function renderOpenedFiles(){
        if (!explorerContent) return;
        const { openEditorsSection } = ensureSections();
        openEditorsSection.innerHTML = '';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.justifyContent = 'space-between';
        header.style.marginBottom = '6px';
        const title = document.createElement('div');
        title.textContent = 'Opened Files';
        title.style.fontSize = '12px';
        title.style.color = '#bdbdbd';
        header.appendChild(title);
        if (openedFiles.length) {
            const closeAll = makeCloseButton(()=>{ openedFiles = []; renderOpenedFiles(); });
            header.appendChild(closeAll);
        }
        openEditorsSection.appendChild(header);

        const list = document.createElement('div');
        openedFiles.forEach(p=>{
            const name = p.split(/[\\\/]/).pop();
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.justifyContent = 'space-between';
            row.style.padding = '2px 4px';
            row.style.borderRadius = '3px';
            row.onmouseenter = () => row.style.background = '#313131';
            row.onmouseleave = () => row.style.background = 'transparent';

            const left = document.createElement('div');
            left.style.display = 'flex';
            left.style.alignItems = 'center';
            left.style.gap = '6px';
            const icon = document.createElement('span'); icon.textContent = '📄';
            const label = document.createElement('span'); label.textContent = name; label.style.color = '#d6d6d6';
            left.appendChild(icon); left.appendChild(label);
            row.appendChild(left);

            const close = makeCloseButton(()=>{
                openedFiles = openedFiles.filter(fp=>fp!==p);
                renderOpenedFiles();
            });
            row.appendChild(close);
            list.appendChild(row);
        });
        openEditorsSection.appendChild(list);
        // do not change currentExplorerRoot here; sections are independent
    }

    // ----- Render: Folder Section (independent) -----
    function renderItemsInto(container, items){
        const list = document.createElement('div');
        items.forEach(it => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.gap = '6px';
            row.style.padding = '2px 4px';
            row.style.borderRadius = '3px';
            row.onmouseenter = () => row.style.background = '#313131';
            row.onmouseleave = () => row.style.background = 'transparent';
            const icon = document.createElement('span');
            icon.textContent = it.type === 'dir' ? '📁' : '📄';
            const name = document.createElement('span');
            name.textContent = it.name;
            name.style.color = '#d6d6d6';
            row.appendChild(icon);
            row.appendChild(name);
            list.appendChild(row);
        });
        container.appendChild(list);
    }

    async function renderDirectory(dirPath){
        if (!explorerContent) return;
        const { folderSection } = ensureSections();
        try{
            const items = await ipcRenderer.invoke('list-directory', dirPath);
            folderSection.innerHTML = '';
            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.alignItems = 'center';
            header.style.justifyContent = 'space-between';
            header.style.marginBottom = '6px';
            const title = document.createElement('div');
            // Show only folder name, not full path
            const folderName = dirPath.split(/[\\\/]/).pop() || dirPath;
            title.textContent = folderName;
            title.style.fontSize = '12px';
            title.style.color = '#bdbdbd';
            header.appendChild(title);
            const close = makeCloseButton(()=>{ renderProjectRoot(); });
            header.appendChild(close);
            folderSection.appendChild(header);

            renderItemsInto(folderSection, items);
            currentExplorerRoot = dirPath;
        }catch(err){ console.error('Render directory failed:', err); }
    }

    async function renderProjectRoot(){
        if (!explorerContent) return;
        const { folderSection } = ensureSections();
        try{
            const items = await ipcRenderer.invoke('list-project');
            folderSection.innerHTML = '';
            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.alignItems = 'center';
            header.style.marginBottom = '6px';
            const title = document.createElement('div');
            title.textContent = 'Documents/ VACodeProject';
            title.style.fontSize = '12px';
            title.style.color = '#bdbdbd';
            header.appendChild(title);
            folderSection.appendChild(header);

            renderItemsInto(folderSection, items);
            currentExplorerRoot = 'PROJECT_ROOT';
        }catch(err){ console.error('Render project root failed:', err); }
    }
    
    // Menu positioning data
    const menuPositions = {
        // Use DOM rects by default; keep file a bit left aligned with icon bar
        'file-menu': { left: '12px' }
    };
    
    // Function to hide all menus
    function hideAllMenus() {
        fileDropdown.classList.remove('show');
        editDropdown.classList.remove('show');
        if (helpDropdown) helpDropdown.classList.remove('show');
    }
    
    // Function to show a specific menu
    function showMenu(menuElement, triggerElement) {
        const triggerId = triggerElement.id;
        const position = menuPositions[triggerId];

        if (position) {
            menuElement.style.left = position.left;
        } else {
            const rect = triggerElement.getBoundingClientRect();
            menuElement.style.left = rect.left + 'px';
        }
        // toggle behavior: if already visible, hide; else show
        if (menuElement.classList.contains('show')) {
            menuElement.classList.remove('show');
        } else {
            hideAllMenus();
            menuElement.classList.add('show');
        }
    }
    
    // File menu event listeners
    fileMenuTrigger.addEventListener('click', function(e) {
        e.stopPropagation();
        showMenu(fileDropdown, fileMenuTrigger);
    });
    
    // Edit menu event listeners
    editMenuTrigger.addEventListener('click', function(e) {
        e.stopPropagation();
        showMenu(editDropdown, editMenuTrigger);
    });

    // Help menu event listeners
    if (helpMenuTrigger && helpDropdown) {
        helpMenuTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            showMenu(helpDropdown, helpMenuTrigger);
        });
    }
    
    // Hide menus when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.menu-trigger') && !e.target.closest('.dropdown-menu')) {
            hideAllMenus();
        }
    });
    
    // Hide menus when pressing Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideAllMenus();
        }
    });

    // Explorer toggle
    if (explorerTrigger && explorerPanel && contentArea) {
        explorerTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            const isShowing = explorerPanel.classList.toggle('show');
            // Adjust content left margin dynamically to match explorer width
            if (isShowing) contentArea.classList.add('shifted');
            const menuWidth = 50; // left fixed menu width
            const panelWidth = isShowing ? explorerPanel.getBoundingClientRect().width : 0;
            contentArea.style.marginLeft = (menuWidth + panelWidth + 10) + 'px';
            if (!isShowing) contentArea.style.marginLeft = '60px';
            if (isShowing) {
                // initial render of both sections
                if (!explorerContent.querySelector('#open-editors-section')) renderOpenedFiles(); else renderOpenedFiles();
                if (!explorerContent.querySelector('#folder-section')) renderProjectRoot();
            }
        });

        // Drag-to-resize logic
        if (explorerResizeHandle) {
            let isResizing = false;
            let startX = 0;
            let startWidth = 0;

            const minWidth = 180;
            const maxWidth = 560;

            explorerResizeHandle.addEventListener('mousedown', function(e) {
                isResizing = true;
                startX = e.clientX;
                startWidth = explorerPanel.getBoundingClientRect().width;
                document.body.style.userSelect = 'none';
            });

            document.addEventListener('mousemove', function(e) {
                if (!isResizing) return;
                const delta = e.clientX - startX;
                let newWidth = startWidth + delta;
                if (newWidth < minWidth) newWidth = minWidth;
                if (newWidth > maxWidth) newWidth = maxWidth;
                explorerPanel.style.width = newWidth + 'px';
                const menuWidth = 50; // left fixed menu width
                contentArea.style.marginLeft = (menuWidth + newWidth + 10) + 'px';
            });

            document.addEventListener('mouseup', function() {
                if (!isResizing) return;
                isResizing = false;
                document.body.style.userSelect = '';
            });
        }

        // Explorer new file/folder actions
        if (newFileBtn) {
            newFileBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const name = window.prompt('Enter file(new) name:');
                if (!name) return;
                try{
                    const created = await ipcRenderer.invoke('create-file', name);
                    console.log('File created at:', created);
                    // refresh folder section only
                    if (currentExplorerRoot === 'PROJECT_ROOT') {
                        renderProjectRoot();
                    } else if (typeof currentExplorerRoot === 'string' && currentExplorerRoot) {
                        renderDirectory(currentExplorerRoot);
                    }
                }catch(err){ console.error('Create file failed:', err); }
            });
        }
        if (newFolderBtn) {
            newFolderBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const name = window.prompt('Enter folder name:');
                if (!name) return;
                try{
                    const created = await ipcRenderer.invoke('create-folder', name);
                    console.log('Folder created at:', created);
                    if (currentExplorerRoot === 'PROJECT_ROOT') {
                        renderProjectRoot();
                    } else if (typeof currentExplorerRoot === 'string' && currentExplorerRoot) {
                        renderDirectory(currentExplorerRoot);
                    }
                }catch(err){ console.error('Create folder failed:', err); }
            });
        }
    }
    
    // Menu item click handlers
    function setupMenuHandlers(menuId, handlers) {
        const menu = document.getElementById(menuId);
        const items = menu.querySelectorAll('.menu-item');
        
        items.forEach((item, index) => {
            item.addEventListener('click', function() {
                if (handlers[index]) {
                    handlers[index]();
                }
                hideAllMenus();
            });
        });
    }
    
    // File menu handlers (align indices with items; separators are ignored by handler mapping)
    const fileHandlers = [
        () => console.log('New File clicked'),
        () => console.log('New Window clicked'),
        async () => { // Open File
            try{
                const files = await ipcRenderer.invoke('open-file-dialog');
                if (files && files.length) {
                    files.forEach(p=>{ if(!openedFiles.includes(p)) openedFiles.push(p); });
                    renderOpenedFiles();
                }
            }catch(err){ console.error('Open file failed:', err); }
        },
        async () => { // Open Folder
            try{
                const dirs = await ipcRenderer.invoke('open-folder-dialog');
                if (dirs && dirs.length) {
                    await renderDirectory(dirs[0]);
                }
            }catch(err){ console.error('Open folder failed:', err); }
        },
        () => console.log('Save clicked'),
        () => console.log('Save As clicked'),
        () => console.log('Exit clicked')
    ];
    
    // Edit menu handlers
    const editHandlers = [
        () => {
            console.log('Undo clicked');
            // TODO: Implement undo functionality
        },
        () => {
            console.log('Redo clicked');
            // TODO: Implement redo functionality
        },
        () => {
            console.log('Cut clicked');
            // TODO: Implement cut functionality
        },
        () => {
            console.log('Copy clicked');
            // TODO: Implement copy functionality
        },
        () => {
            console.log('Paste clicked');
            // TODO: Implement paste functionality
        }
    ];
    
    // Setup menu handlers
    setupMenuHandlers('file-dropdown', fileHandlers);
    setupMenuHandlers('edit-dropdown', editHandlers);

    // Help menu handlers
    const helpHandlers = [
        () => {
            // Open Electron website
            window.open('https://www.electronjs.org/', '_blank');
        },
        () => {
            // Open xterm.js website
            window.open('https://xtermjs.org/', '_blank');
        },
        () => {
            // Open instruction.html in a new window (separate)
            window.open('instruction.html', '_blank');
        }
    ];
    if (helpDropdown) {
        setupMenuHandlers('help-dropdown', helpHandlers);
    }
});