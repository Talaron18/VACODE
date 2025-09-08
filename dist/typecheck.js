"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.check_type = check_type;
let fileOrFolder = 'none';
function button_status(file_id, folder_id) {
    const button1 = document.getElementById(file_id);
    const button2 = document.getElementById(folder_id);
    button1.addEventListener('click', () => {
        fileOrFolder = 'file';
    });
    button2.addEventListener('click', () => {
        fileOrFolder = 'folder';
    });
    return fileOrFolder;
}
function type(fileOrFolder) {
    if (fileOrFolder === 'file') {
        return true;
    }
    else if (fileOrFolder === 'folder') {
        return false;
    }
}
function check_type(file_id, folder_id) {
    let fileOrFolder = 'none';
    return button_status(file_id, folder_id) && type(fileOrFolder);
}
//# sourceMappingURL=typecheck.js.map