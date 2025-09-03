export {};

declare global {
  interface Window {
    cardano?: {
      midnight?: {
        enable: () => Promise<any>;
        isEnabled?: () => Promise<boolean>;
        // extend with more methods as needed
      };
    };
    midnight?: Record<string, any>; // Lace may inject here
  }
}
