declare global {
  interface Window {
    electronAPI?: {
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      expandToTab: (tab: string) => Promise<void>;
    };
  }
}

export {};