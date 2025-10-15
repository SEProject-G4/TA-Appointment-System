/// <reference types="vite/client" />

// Google Identity Services type declarations
interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: any) => void;
        prompt: (momentListener?: (notification: any) => void) => void;
        renderButton: (parent: HTMLElement, options: any) => void;
        cancel: () => void;
      };
    };
  };
}
