"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileOperations = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const project_manager_1 = require("./project-manager");
const file_type_utils_1 = require("./file-type-utils");
// 文件操作类 - 负责处理文件和文件夹的创建、读取、写入等操作
class FileOperations {
    constructor() {
        this.projectManager = new project_manager_1.ProjectManager();
    }
    // 创建文件
    async createFile(fileName, targetDir) {
        const safeName = String(fileName || '').trim();
        if (!safeName) {
            throw new Error('Empty file name');
        }
        const base = targetDir || this.projectManager.getBaseProjectDir();
        const parsed = path.parse(safeName);
        const nameWithoutExt = parsed.name;
        const extension = parsed.ext;
        let finalName = safeName;
        let counter = 1;
        let target = path.join(base, finalName);
        while (fs.existsSync(target)) {
            finalName = `${nameWithoutExt} (${counter})${extension}`;
            target = path.join(base, finalName);
            counter++;
        }
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, '');
        return target;
    }
    // 创建文件夹
    async createFolder(folderName, targetDir) {
        const safeName = String(folderName || '').trim();
        if (!safeName) {
            throw new Error('Empty folder name');
        }
        const base = targetDir || this.projectManager.getBaseProjectDir();
        let finalName = safeName;
        let counter = 1;
        let finalPath = path.join(base, finalName);
        while (fs.existsSync(finalPath)) {
            finalName = `${safeName} (${counter})`;
            finalPath = path.join(base, finalName);
            counter++;
        }
        fs.mkdirSync(finalPath, { recursive: true });
        return finalPath;
    }
    // 列出目录内容
    async listDirectory(dirPath) {
        const safePath = String(dirPath || '').trim();
        if (!safePath) {
            return [];
        }
        try {
            const entries = fs.readdirSync(safePath, { withFileTypes: true });
            return entries.map(e => {
                const itemPath = path.join(safePath, e.name);
                const result = {
                    name: e.name,
                    type: e.isDirectory() ? 'dir' : 'file',
                    path: itemPath
                };
                // 如果是文件，添加文件类型信息
                if (!e.isDirectory()) {
                    result.fileType = file_type_utils_1.FileTypeUtils.getFileType(itemPath);
                }
                return result;
            });
        }
        catch (error) {
            console.error('Error reading directory:', error);
            return [];
        }
    }
    async listProject() {
        const base = this.projectManager.getBaseProjectDir();
        return this.listDirectory(base);
    }
    exists(path) {
        try {
            return fs.existsSync(path);
        }
        catch (error) {
            return false;
        }
    }
    readFile(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf-8');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to read file: ${errorMessage}`);
        }
    }
    writeFile(filePath, content) {
        try {
            fs.writeFileSync(filePath, content, 'utf-8');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to write file: ${errorMessage}`);
        }
    }
}
exports.FileOperations = FileOperations;
//# sourceMappingURL=file-operations.js.map