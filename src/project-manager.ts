import { app } from 'electron';

export class ProjectManager {
    public getBaseProjectDir(): string {
        return app.getPath('desktop');
    }

    public validatePath(path: string): boolean {
        if (!path || typeof path !== 'string') {
            return false;
        }
        
        const trimmedPath = path.trim();
        return trimmedPath.length > 0 && !trimmedPath.includes('..');
    }

    public getProjectDisplayName(projectPath: string): string {
        const defaultPath = this.getBaseProjectDir();
        if (projectPath === defaultPath) {
            return 'Desktop';
        }
        return projectPath.split(/[/\\]/).pop() || 'Folder';
    }
}
