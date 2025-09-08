let fileOrFolder='none';
function button_status(file_id:string,folder_id:string){
    const button1=document.getElementById(file_id) as HTMLButtonElement;
    const button2=document.getElementById(folder_id) as HTMLButtonElement;
    
    button1.addEventListener('click',()=>{
        fileOrFolder='file';
    })
    button2.addEventListener('click',()=>{
        fileOrFolder='folder';
    })
    return fileOrFolder;
}
function type(fileOrFolder:string):boolean{
    if(fileOrFolder==='file'){
        return true;
    }else if(fileOrFolder==='folder'){
        return false;
    }
}

export function check_type(file_id:string,folder_id:string){
    let fileOrFolder='none';
    return button_status(file_id,folder_id) && type(fileOrFolder);
}