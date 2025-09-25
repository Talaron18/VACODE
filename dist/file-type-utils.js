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
exports.FileTypeUtils = void 0;
const path = __importStar(require("path"));
const FILE_TYPE_MAP = {
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
    '.py': { type: 'python', category: 'language', iconclass: 'icon-py', language: 'python', color: '#3776ab' },
    '.java': { type: 'java', category: 'language', iconclass: 'icon-java', language: 'java', color: '#ed8b00' },
    '.cpp': { type: 'cpp', category: 'language', iconclass: 'icon-language-cpp', language: 'cpp', color: '#00599c' },
    '.c': { type: 'c', category: 'language', iconclass: 'icon-cyuyan', language: 'c', color: '#00599c' },
    '.cs': { type: 'csharp', category: 'language', iconclass: 'icon-csharp', language: 'csharp', color: '#239120' },
    '.php': { type: 'php', category: 'language', iconclass: 'icon-php', language: 'php', color: '#777bb4' },
    '.rb': { type: 'ruby', category: 'language', iconclass: 'icon-py', language: 'ruby', color: '#cc342d' },
    '.go': { type: 'go', category: 'language', iconclass: 'icon-go', language: 'go', color: '#00add8' },
    '.rs': { type: 'rust', category: 'language', iconclass: 'icon-go', language: 'rust', color: '#ce422b' },
    '.swift': { type: 'swift', category: 'language', iconclass: 'icon-swift', language: 'swift', color: '#fa7343' },
    '.kt': { type: 'kotlin', category: 'language', iconclass: 'icon-java', language: 'kotlin', color: '#7f52ff' },
    '.dart': { type: 'dart', category: 'language', iconclass: 'icon-dart', language: 'dart', color: '#0175c2' },
    '.sh': { type: 'shell', category: 'script', iconclass: 'icon-sh', language: 'shell', color: '#89e051' },
    '.bash': { type: 'bash', category: 'script', iconclass: 'icon-bash', language: 'bash', color: '#89e051' },
    '.ps1': { type: 'powershell', category: 'script', iconclass: 'icon-ps1', language: 'powershell', color: '#012456' },
    '.bat': { type: 'batch', category: 'script', iconclass: 'icon-bat', language: 'batch', color: '#c1c1c1' },
    '.cmd': { type: 'batch', category: 'script', iconclass: 'icon-cmd', language: 'batch', color: '#c1c1c1' },
    '.yaml': { type: 'yaml', category: 'config', iconclass: 'icon-YAML', language: 'yaml', color: '#cb171e' },
    '.yml': { type: 'yaml', category: 'config', iconclass: 'icon-YAML', language: 'yaml', color: '#cb171e' },
    '.toml': { type: 'toml', category: 'config', iconclass: 'icon-Toml', language: 'toml', color: '#9c4221' },
    '.ini': { type: 'ini', category: 'config', iconclass: 'icon-INI', language: 'ini', color: '#c0c0c0' },
    '.env': { type: 'env', category: 'config', iconclass: 'icon-env', language: 'env', color: '#f0f0f0' },
    '.gitignore': { type: 'gitignore', category: 'config', iconclass: 'icon-gitignore', language: 'gitignore', color: '#3178c6' },
    '.gitattributes': { type: 'gitattributes', category: 'config', iconclass: 'icon-gitignore', language: 'gitattributes', color: '#3178c6' },
    '.dockerfile': { type: 'dockerfile', category: 'config', iconclass: 'icon-dockerfile', language: 'dockerfile', color: '#2496ed' },
    '.md': { type: 'markdown', category: 'document', iconclass: 'icon-txt', language: 'markdown', color: '#083fa1' },
    '.txt': { type: 'text', category: 'document', iconclass: 'icon-txt', language: 'text', color: '#cccccc' },
    '.rtf': { type: 'rtf', category: 'document', iconclass: 'icon-RTF', language: 'rtf', color: '#cccccc' },
    '.png': { type: 'image', category: 'media', iconclass: 'icon-png', language: 'image', color: '#ff6b6b' },
    '.jpg': { type: 'image', category: 'media', iconclass: 'icon-png', language: 'image', color: '#ff6b6b' },
    '.jpeg': { type: 'image', category: 'media', iconclass: 'icon-png', language: 'image', color: '#ff6b6b' },
    '.gif': { type: 'image', category: 'media', iconclass: 'icon-png', language: 'image', color: '#ff6b6b' },
    '.svg': { type: 'svg', category: 'media', iconclass: 'icon-svg', language: 'svg', color: '#ffb13b' },
    '.ico': { type: 'icon', category: 'media', iconclass: 'icon-ico', language: 'image', color: '#ff6b6b' },
    '.ttf': { type: 'font', category: 'media', iconclass: 'icon-ttf', language: 'font', color: '#8b4513' },
    '.otf': { type: 'font', category: 'media', iconclass: 'icon-ttf', language: 'font', color: '#8b4513' },
    '.woff': { type: 'font', category: 'media', iconclass: 'icon-ttf', language: 'font', color: '#8b4513' },
    '.woff2': { type: 'font', category: 'media', iconclass: 'icon-ttf', language: 'font', color: '#8b4513' },
    '.zip': { type: 'archive', category: 'archive', iconclass: 'icon-zip-full', language: 'archive', color: '#ffa500' },
    '.rar': { type: 'archive', category: 'archive', iconclass: 'icon-zip-full', language: 'archive', color: '#ffa500' },
    '.7z': { type: 'archive', category: 'archive', iconclass: 'icon-zip-full', language: 'archive', color: '#ffa500' },
    '.tar': { type: 'archive', category: 'archive', iconclass: 'icon-zip-full', language: 'archive', color: '#ffa500' },
    '.gz': { type: 'archive', category: 'archive', iconclass: 'icon-zip-full', language: 'archive', color: '#ffa500' },
    '.sql': { type: 'sql', category: 'database', iconclass: 'icon-mysql', language: 'sql', color: '#336791' },
    '.log': { type: 'log', category: 'system', iconclass: 'icon-txt', language: 'log', color: '#666666' },
    '.lock': { type: 'lock', category: 'system', iconclass: 'icon-txt', language: 'lock', color: '#ff0000' },
    '.lnk': { type: 'lnk', category: 'system', iconclass: 'icon-lnk-f', language: 'lnk', color: '#ffffff', size: 'small' },
};
const DEFAULT_FILE_TYPE = {
    type: 'unknown',
    category: 'other',
    iconclass: 'icon-txt',
    language: 'text',
    color: '#666666'
};
class FileTypeUtils {
    static getFileType(filePath) {
        const fileName = path.basename(filePath).toLowerCase();
        const ext = path.extname(filePath).toLowerCase();
        if (FILE_TYPE_MAP[fileName]) {
            return FILE_TYPE_MAP[fileName];
        }
        if (ext && FILE_TYPE_MAP[ext]) {
            return FILE_TYPE_MAP[ext];
        }
        return DEFAULT_FILE_TYPE;
    }
    static getFileTypeByExtension(extension) {
        const ext = extension.toLowerCase();
        return FILE_TYPE_MAP[ext] || DEFAULT_FILE_TYPE;
    }
    static getFileIcon(filePath) {
        return this.getFileType(filePath).iconclass;
    }
    static getFileTypeName(filePath) {
        return this.getFileType(filePath).type;
    }
    static getFileCategory(filePath) {
        return this.getFileType(filePath).category;
    }
    static getFileLanguage(filePath) {
        return this.getFileType(filePath).language;
    }
    static getFileColor(filePath) {
        return this.getFileType(filePath).color;
    }
    static isFileType(filePath, type) {
        return this.getFileType(filePath).type === type;
    }
    static isFileCategory(filePath, category) {
        return this.getFileType(filePath).category === category;
    }
    static getAllFileTypes() {
        return { ...FILE_TYPE_MAP };
    }
    static getFileTypesByCategory(category) {
        return Object.values(FILE_TYPE_MAP).filter(type => type.category === category);
    }
    static getAllCategories() {
        const categories = new Set();
        Object.values(FILE_TYPE_MAP).forEach(type => categories.add(type.category));
        return Array.from(categories);
    }
}
exports.FileTypeUtils = FileTypeUtils;
//# sourceMappingURL=file-type-utils.js.map