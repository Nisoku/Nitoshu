export {};

declare global {
  const __IS_SINGLE_FILE__: boolean;

  interface LaunchParams {
    readonly files?: readonly FileSystemFileHandle[];
    readonly targetURL?: string;
  }

  interface LaunchQueue {
    setConsumer(consumer: (params: LaunchParams) => void): void;
  }

  interface Window {
    launchQueue?: LaunchQueue;
    triggerLoad: () => void;
    openFolder: () => Promise<void>;
    saveFile: () => void;
    loadFile: (input: HTMLInputElement) => void;
    readFile: (file: File) => void;
  }
}
