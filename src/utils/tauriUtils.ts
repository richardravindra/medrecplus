// Utility functions for Tauri plugin access with error handling
interface TauriAPI {
  [key: string]: unknown;
}

declare global {
  interface Window {
    __TAURI__?: TauriAPI;
  }
}

export async function importTauriDialog() {
  if (!window.__TAURI__) {
    throw new Error('Not in Tauri environment');
  }

  try {
    // Use dynamic import with proper typing
    const dialogModule = await Function('return import("@tauri-apps/plugin-dialog")')() as Record<string, unknown>;
    return dialogModule;
  } catch {
    throw new Error('Failed to import Tauri dialog plugin');
  }
}

export async function importTauriFs() {
  if (!window.__TAURI__) {
    throw new Error('Not in Tauri environment');
  }

  try {
    // Use dynamic import with proper typing
    const fsModule = await Function('return import("@tauri-apps/plugin-fs")')() as Record<string, unknown>;
    return fsModule;
  } catch {
    throw new Error('Failed to import Tauri fs plugin');
  }
}

export function isTauriEnvironment(): boolean {
  return !!window.__TAURI__;
}