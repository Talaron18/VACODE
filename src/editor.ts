import * as monaco from 'monaco-editor';

export async function openInEditor(container: HTMLElement,fileDir:string) {
    let saved = true;
    const filename = fileDir.split(/[/\\]/).pop()!;
    let type = filename.split(".").pop();
    if(type === "js"){
        type="javascript";
    }else if(type === "py"){
        type="python";
    }else if(type === "ts"){
        type="typescript";
    }
    console.log(type);

    const editorHead= document.createElement("div");
    editorHead.style.position='relative';
    editorHead.style.display='flex';
    editorHead.style.width='100%';
    editorHead.style.backgroundColor='#212121ff';
    container.appendChild(editorHead);

    const editorHeadTitle= document.createElement("span");
    editorHeadTitle.style.position='relative';
    editorHeadTitle.style.background='none';
    editorHeadTitle.style.color='#fff';
    editorHeadTitle.style.marginLeft='2px';
    editorHeadTitle.style.fontSize='small';
    editorHeadTitle.textContent=filename;
    editorHead.appendChild(editorHeadTitle);

    const closeBtn=document.createElement('span');
    closeBtn.style.visibility='hidden';
    closeBtn.style.position='relative';
    closeBtn.style.background='none';
    closeBtn.style.cursor='pointer';
    closeBtn.style.fontSize='small';
    closeBtn.style.marginLeft='2px';
    closeBtn.textContent=' ×';
    closeBtn.style.color='#fff';
    closeBtn.style.borderRight='1px solid #ffffff50';
    editorHead.appendChild(closeBtn);
    editorHead.onmouseover=(()=>{
        closeBtn.style.visibility='visible';
    });
    editorHead.onmouseout=(()=>{
        closeBtn.style.visibility='hidden';
    });
    closeBtn.onclick=(()=>{
        if(!saved){
            window.alert("Changes not saved.");
        }else{
            container.removeChild(editorContainer);
            container.removeChild(editorHead);
        }
    });
    const code = await window.editorAPI.readFile(fileDir);
    const editorContainer = document.createElement("div");
    editorContainer.style.borderTop='1px solid #656565';
    editorContainer.style.width = "100%";
    editorContainer.style.height = "100%";
    editorContainer.style.position = "relative";
    editorContainer.id = filename;
    container.appendChild(editorContainer);

    const editor = monaco.editor.create(editorContainer, {
        value: code || "",
        language: type,
        theme: "vs-dark",
        automaticLayout: true,
    });

    editor.onDidChangeModelContent(() => {
        saved = false;
        closeBtn.style.fontSize='medium';
        closeBtn.style.fontWeight='bold';
        closeBtn.style.position='center';
        closeBtn.textContent='·';
    });

    editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        () => {
            saveInFile(editor,fileDir);
            closeBtn.style.fontSize='small';
            closeBtn.textContent=' ×';
            saved = true;
        }
    );

    return editor;
};


export function saveInFile(editor: monaco.editor.IStandaloneCodeEditor,fileDir:string) {
    const code = editor.getValue();
    window.editorAPI.writeFile(fileDir, code);
}
