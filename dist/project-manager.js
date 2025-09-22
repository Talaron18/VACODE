"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectManager = void 0;
const electron_1 = require("electron");
class ProjectManager {
    getBaseProjectDir() {
        return electron_1.app.getPath('desktop');
    }
    validatePath(path) {
        if (!path || typeof path !== 'string') {
            return false;
        }
        const trimmedPath = path.trim();
        return trimmedPath.length > 0 && !trimmedPath.includes('..');
    }
    getProjectDisplayName(projectPath) {
        const defaultPath = this.getBaseProjectDir();
        if (projectPath === defaultPath) {
            return 'Desktop';
        }
        return projectPath.split(/[/\\]/).pop() || 'Folder';
    }
}
exports.ProjectManager = ProjectManager;
//# sourceMappingURL=project-manager.js.map