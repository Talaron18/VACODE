import * as path from 'path';

// 文件类型定义
export interface FileTypeInfo {
    type: string;           // 文件类型名称
    category: string;       // 文件分类
    iconclass: string;          // 显示图标
    language: string;      // 编程语言
    color: string;         // 主题颜色
    size?: string;         // 图标大小: 'small', 'normal', 'large'
}

// 文件类型映射表
const FILE_TYPE_MAP: Record<string, FileTypeInfo> = {
    // Web 开发
    '.html': { type: 'html', category: 'web', iconclass: 'icon-html', language: 'html', color: '#e34c26' },
    '.htm': { type: 'html', category: 'web', iconclass: 'icon-html', language: 'html', color: '#e34c26' },
    '.css': { type: 'css', category: 'web', iconclass: 'icon-jinghao', language: 'css', color: '#1572b6' },
    '.scss': { type: 'scss', category: 'web', iconclass: 'icon-jinghao', language: 'scss', color: '#cf649a' },
    '.sass': { type: 'sass', category: 'web', iconclass: 'icon-jinghao', language: 'sass', color: '#cf649a' },
    '.less': { type: 'less', category: 'web', iconclass: 'icon-jinghao', language: 'less', color: '#1d365d' },
    '.js': { type: 'javascript', category: 'web', iconclass: 'icon-js', language: 'javascript', color: '#f7df1e' },
    '.jsx': { type: 'jsx', category: 'web', iconclass: 'icon-jsx', language: 'javascript', color: '#61dafb' },
    '.ts': { type: 'typescript', category: 'web', iconclass: 'icon-ts', language: 'typescript', color: '#3178c6' },
    '.tsx': { type: 'tsx', category: 'web', iconclass: 'icon-jsx', language: 'typescript', color: '#3178c6' },
    '.vue': { type: 'vue', category: 'web', iconclass: 'icon-vue', language: 'vue', color: '#4fc08d' },
    '.json': { type: 'json', category: 'data', iconclass: 'icon-json', language: 'json', color: '#f7df1e' },
    '.xml': { type: 'xml', category: 'data', iconclass: 'icon-xml', language: 'xml', color: '#ff6600' },

    // 编程语言
    '.py': { type: 'python', category: 'language', iconclass: 'icon-py', language: 'python', color: '#3776ab' },
    '.java': { type: 'java', category: 'language', iconclass: 'icon-java', language: 'java', color: '#ed8b00' },
    '.cpp': { type: 'cpp', category: 'language', iconclass: 'icon-language-cpp', language: 'cpp', color: '#00599c' },
    '.c': { type: 'c', category: 'language', iconclass: 'icon-language-cpp', language: 'c', color: '#00599c' },
    '.cs': { type: 'csharp', category: 'language', iconclass: 'icon-csharp', language: 'csharp', color: '#239120' },
    '.php': { type: 'php', category: 'language', iconclass: 'icon-php', language: 'php', color: '#777bb4' },
    '.rb': { type: 'ruby', category: 'language', iconclass: 'icon-py', language: 'ruby', color: '#cc342d' },
    '.go': { type: 'go', category: 'language', iconclass: 'icon-go', language: 'go', color: '#00add8' },
    '.rs': { type: 'rust', category: 'language', iconclass: 'icon-go', language: 'rust', color: '#ce422b' },
    '.swift': { type: 'swift', category: 'language', iconclass: 'icon-swift', language: 'swift', color: '#fa7343' },
    '.kt': { type: 'kotlin', category: 'language', iconclass: 'icon-java', language: 'kotlin', color: '#7f52ff' },
    '.dart': { type: 'dart', category: 'language', iconclass: 'icon-dart', language: 'dart', color: '#0175c2' },

    // 脚本语言
    '.sh': { type: 'shell', category: 'script', iconclass: 'icon-sh', language: 'shell', color: '#89e051' },
    '.bash': { type: 'bash', category: 'script', iconclass: 'icon-bash', language: 'bash', color: '#89e051' },
    '.ps1': { type: 'powershell', category: 'script', iconclass: 'icon-ps1', language: 'powershell', color: '#012456' },
    '.bat': { type: 'batch', category: 'script', iconclass: 'icon-bat', language: 'batch', color: '#c1c1c1' },
    '.cmd': { type: 'batch', category: 'script', iconclass: 'icon-cmd', language: 'batch', color: '#c1c1c1' },

    // 配置文件
    '.yaml': { type: 'yaml', category: 'config', iconclass: 'icon-YAML', language: 'yaml', color: '#cb171e' },
    '.yml': { type: 'yaml', category: 'config', iconclass: 'icon-YAML', language: 'yaml', color: '#cb171e' },
    '.toml': { type: 'toml', category: 'config', iconclass: 'icon-Toml', language: 'toml', color: '#9c4221' },
    '.ini': { type: 'ini', category: 'config', iconclass: 'icon-INI', language: 'ini', color: '#c0c0c0' },
    '.env': { type: 'env', category: 'config', iconclass: 'icon-env', language: 'env', color: '#f0f0f0' },
    '.gitignore': { type: 'gitignore', category: 'config', iconclass: 'icon-gitignore', language: 'gitignore', color: '#3178c6' },
    '.gitattributes': { type: 'gitattributes', category: 'config', iconclass: 'icon-gitignore', language: 'gitattributes', color: '#3178c6' },
    '.dockerfile': { type: 'dockerfile', category: 'config', iconclass: 'icon-dockerfile', language: 'dockerfile', color: '#2496ed' },

    // 文档
    '.md': { type: 'markdown', category: 'document', iconclass: 'icon-txt', language: 'markdown', color: '#083fa1' },
    '.txt': { type: 'text', category: 'document', iconclass: 'icon-txt', language: 'text', color: '#cccccc' },
    '.rtf': { type: 'rtf', category: 'document', iconclass: 'icon-RTF', language: 'rtf', color: '#cccccc' },

    // 图片
    '.png': { type: 'image', category: 'media', iconclass: 'icon-png', language: 'image', color: '#ff6b6b' },
    '.jpg': { type: 'image', category: 'media', iconclass: 'icon-png', language: 'image', color: '#ff6b6b' },
    '.jpeg': { type: 'image', category: 'media', iconclass: 'icon-png', language: 'image', color: '#ff6b6b' },
    '.gif': { type: 'image', category: 'media', iconclass: 'icon-png', language: 'image', color: '#ff6b6b' },
    '.svg': { type: 'svg', category: 'media', iconclass: 'icon-svg', language: 'svg', color: '#ffb13b' },
    '.ico': { type: 'icon', category: 'media', iconclass: 'icon-ico', language: 'image', color: '#ff6b6b' },

    // 字体
    '.ttf': { type: 'font', category: 'media', iconclass: 'icon-ttf', language: 'font', color: '#8b4513' },
    '.otf': { type: 'font', category: 'media', iconclass: 'icon-ttf', language: 'font', color: '#8b4513' },
    '.woff': { type: 'font', category: 'media', iconclass: 'icon-ttf', language: 'font', color: '#8b4513' },
    '.woff2': { type: 'font', category: 'media', iconclass: 'icon-ttf', language: 'font', color: '#8b4513' },

    // 压缩文件
    '.zip': { type: 'archive', category: 'archive', iconclass: 'icon-zip-full', language: 'archive', color: '#ffa500' },
    '.rar': { type: 'archive', category: 'archive', iconclass: 'icon-zip-full', language: 'archive', color: '#ffa500' },
    '.7z': { type: 'archive', category: 'archive', iconclass: 'icon-zip-full', language: 'archive', color: '#ffa500' },
    '.tar': { type: 'archive', category: 'archive', iconclass: 'icon-zip-full', language: 'archive', color: '#ffa500' },
    '.gz': { type: 'archive', category: 'archive', iconclass: 'icon-zip-full', language: 'archive', color: '#ffa500' },

    // 其他
    '.sql': { type: 'sql', category: 'database', iconclass: 'icon-mysql', language: 'sql', color: '#336791' },
    '.log': { type: 'log', category: 'system', iconclass: 'icon-txt', language: 'log', color: '#666666' },
    '.lock': { type: 'lock', category: 'system', iconclass: 'icon-txt', language: 'lock', color: '#ff0000' },
    '.lnk': { type: 'lnk', category: 'system', iconclass: 'icon-lnk-f', language: 'lnk', color: '#ffffff', size: 'small' },
};

// 默认文件类型
const DEFAULT_FILE_TYPE: FileTypeInfo = {
    type: 'unknown',
    category: 'other',
    iconclass: 'icon-txt',
    language: 'text',
    color: '#666666'
};

/**
 * 文件类型识别工具类
 */
export class FileTypeUtils {
    /**
     * 根据文件路径获取文件类型信息
     * @param filePath 文件路径
     * @returns 文件类型信息
     */
    public static getFileType(filePath: string): FileTypeInfo {
        const fileName = path.basename(filePath).toLowerCase();
        const ext = path.extname(filePath).toLowerCase();
        
        // 首先检查完整文件名（用于 .gitignore, .gitattributes 等）
        if (FILE_TYPE_MAP[fileName]) {
            return FILE_TYPE_MAP[fileName];
        }
        
        // 然后检查扩展名
        if (ext && FILE_TYPE_MAP[ext]) {
            return FILE_TYPE_MAP[ext];
        }
        
        return DEFAULT_FILE_TYPE;
    }

    /**
     * 根据文件扩展名获取文件类型信息
     * @param extension 文件扩展名（带点号，如 .js）
     * @returns 文件类型信息
     */
    public static getFileTypeByExtension(extension: string): FileTypeInfo {
        const ext = extension.toLowerCase();
        return FILE_TYPE_MAP[ext] || DEFAULT_FILE_TYPE;
    }

    /**
     * 获取文件图标
     * @param filePath 文件路径
     * @returns 文件图标
     */
    public static getFileIcon(filePath: string): string {
        return this.getFileType(filePath).iconclass;
    }

    /**
     * 获取文件类型名称
     * @param filePath 文件路径
     * @returns 文件类型名称
     */
    public static getFileTypeName(filePath: string): string {
        return this.getFileType(filePath).type;
    }

    /**
     * 获取文件分类
     * @param filePath 文件路径
     * @returns 文件分类
     */
    public static getFileCategory(filePath: string): string {
        return this.getFileType(filePath).category;
    }

    /**
     * 获取编程语言
     * @param filePath 文件路径
     * @returns 编程语言
     */
    public static getFileLanguage(filePath: string): string {
        return this.getFileType(filePath).language;
    }

    /**
     * 获取文件主题颜色
     * @param filePath 文件路径
     * @returns 主题颜色
     */
    public static getFileColor(filePath: string): string {
        return this.getFileType(filePath).color;
    }

    /**
     * 检查是否为特定类型的文件
     * @param filePath 文件路径
     * @param type 文件类型
     * @returns 是否为指定类型
     */
    public static isFileType(filePath: string, type: string): boolean {
        return this.getFileType(filePath).type === type;
    }

    /**
     * 检查是否为特定分类的文件
     * @param filePath 文件路径
     * @param category 文件分类
     * @returns 是否为指定分类
     */
    public static isFileCategory(filePath: string, category: string): boolean {
        return this.getFileType(filePath).category === category;
    }

    /**
     * 获取所有支持的文件类型
     * @returns 所有文件类型映射
     */
    public static getAllFileTypes(): Record<string, FileTypeInfo> {
        return { ...FILE_TYPE_MAP };
    }

    /**
     * 获取指定分类的所有文件类型
     * @param category 文件分类
     * @returns 指定分类的文件类型数组
     */
    public static getFileTypesByCategory(category: string): FileTypeInfo[] {
        return Object.values(FILE_TYPE_MAP).filter(type => type.category === category);
    }

    /**
     * 获取所有文件分类
     * @returns 所有文件分类数组
     */
    public static getAllCategories(): string[] {
        const categories = new Set<string>();
        Object.values(FILE_TYPE_MAP).forEach(type => categories.add(type.category));
        return Array.from(categories);
    }
}
