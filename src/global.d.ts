export {};

declare global {
  interface Window {
    electronAPI: {
      resize: (cols: number, rows: number) => void;
    };
  }
}
