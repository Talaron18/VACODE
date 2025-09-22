import * as fs from 'fs';
import * as path from 'path';
import { ProjectManager } from './project-manager';
import { FileTypeUtils, FileTypeInfo } from './file-type-utils';

// 文件操作类 - 负责处理文件和文件夹的创建、读取、写入等操作
export class FileOperations {
    private projectManager: ProjectManager;

    constructor() {
        this.projectManager = new ProjectManager();
    }

    // 创建文件
    public async createFile(fileName: string, targetDir?: string): Promise<string> {
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
    public async createFolder(folderName: string, targetDir?: string): Promise<string> {
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
    public async listDirectory(dirPath: string): Promise<Array<{name: string, type: string, path: string, fileType?: FileTypeInfo}>> {
        const safePath = String(dirPath || '').trim();
        if (!safePath) {
            return [];
        }
        
        try {
            const entries = fs.readdirSync(safePath, { withFileTypes: true });
            return entries.map(e => {
                const itemPath = path.join(safePath, e.name);
                const result: any = {
                    name: e.name,
                    type: e.isDirectory() ? 'dir' : 'file',
                    path: itemPath
                };
                
                // 如果是文件，添加文件类型信息
                if (!e.isDirectory()) {
                    result.fileType = FileTypeUtils.getFileType(itemPath);
                }
                
                return result;
            });
        } catch (error) {
            console.error('Error reading directory:', error);
            return [];
        }
    }

    public async listProject(): Promise<Array<{name: string, type: string, path: string, fileType?: FileTypeInfo}>> {
        const base = this.projectManager.getBaseProjectDir();
        return this.listDirectory(base);
    }

    public exists(path: string): boolean {
        try {
            return fs.existsSync(path);
        } catch (error) {
            return false;
        }
    }

    public readFile(filePath: string): string {
        try {
            return fs.readFileSync(filePath, 'utf-8');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to read file: ${errorMessage}`);
        }
    }

    public writeFile(filePath: string, content: string): void {
        try {
            fs.writeFileSync(filePath, content, 'utf-8');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to write file: ${errorMessage}`);
        }
    }
}