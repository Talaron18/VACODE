export {};

declare global {
  interface Window {
    electronAPI: {
      resize: (cols: number, rows: number) => void;
      createTerminal: () => void;
      sendInput: (input: string) => void;
      onData: (callback: (data: string) => void) => void;
      getCwd: () => string;
    };
    editorAPI: {
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, content: string) => Promise<void>;
    };
  }

  interface WindowEventMap {
    'addOpenedFile': CustomEvent<string>;
  }
}
