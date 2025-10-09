// Simple toast manager
let toastCallback: ((message: string, type: "success" | "error" | "warning" | "info") => void) | null = null;

export const registerToast = (callback: (message: string, type: "success" | "error" | "warning" | "info") => void) => {
  toastCallback = callback;
};

export const showToast = (message: string, type: "success" | "error" | "warning" | "info" = "info") => {
  if (toastCallback) {
    toastCallback(message, type);
  }
};
