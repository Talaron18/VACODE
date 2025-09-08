export interface docBoxes{
    file_dir?:string;
    type:'doc';
    name?:string;
    status?:string;
    mode?:boolean;
    order?:number; // order of the document in the list
    language?:string;
}

export interface headerBoxes{
    type:'header';
    name?:string;
    order?:number;
    status?:boolean;
}

export interface menuBoxes{
    type:'menu';
    name?:string;
    status?:boolean;
    children?:folderBoxes[] | copilotBox[];
}

export interface folderBoxes{
    type:'folder';
    name?:string;
    order?:number;
    status:string;
    children?:docBoxes[];
    custom:{
        height:number;
        width:number;
    }
}

export interface copilotBox{
    type:'copilot';
    status:boolean;
    cuildren?:textBox[];
    custom?:{
        height:number;
        width:number;
    }
}

export interface textBox{
    type:'text';
    input?:string;
}

export interface codeBox{
    type:'code';
    input?:string;
    language?:string;
    style?:{
        color:string;
        fontWeight:string;
    };
}

export interface addButton{
    type:'add';
    name:string;
    status:boolean;
}