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
    // eslint-disable-next-line no-new-func
    const dialogModule = (await Function('return import("@tauri-apps/plugin-dialog")')()) as Record<
      string,
      unknown
    >;
    return dialogModule;
  } catch {
    throw new Error('Failed to import Tauri dialog plugin');
  }
}

export async function importTauriFs() {
  // Check for Tauri global object
  if (typeof window !== 'undefined' && window.__TAURI__) {
    try {
      // Try importing the fs plugin
      // eslint-disable-next-line no-new-func
      const fsModule = (await Function('return import("@tauri-apps/plugin-fs")')()) as Record<
        string,
        unknown
      >;
        return fsModule;
    } catch {
        throw new Error('Failed to import Tauri fs plugin');
    }
  } else {
        throw new Error('Not in Tauri environment');
  }
}

export async function importTauriShell() {
  // Check for Tauri global object
  if (typeof window !== 'undefined' && window.__TAURI__) {
    try {
      // Try importing the shell plugin
      // eslint-disable-next-line no-new-func
      const shellModule = (await Function('return import("@tauri-apps/plugin-shell")')()) as Record<
        string,
        unknown
      >;
      return shellModule;
    } catch {
      throw new Error('Failed to import Tauri shell plugin');
    }
  } else {
        throw new Error('Not in Tauri environment');
  }
}

export async function createPrintFile(content: string): Promise<string> {
  try {
    const fsModule = await importTauriFs();
    const { writeFile, exists, mkdir } = fsModule as {
      writeFile: (path: string, data: Uint8Array) => Promise<void>;
      exists: (path: string) => Promise<boolean>;
      mkdir: (path: string, options?: { recursive?: boolean }) => Promise<void>;
    };

    // Try to use current directory first
    const tempDir = './temp';

    // If current directory doesn't work, try app temp directory
    if (!(await exists(tempDir))) {
      await mkdir(tempDir, { recursive: true });
    }

    // Create temporary HTML file for printing
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `invoice-print-${timestamp}.html`;
    const filePath = `${tempDir}/${filename}`;

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice</title>
  <style>
    @page {
      margin: 0.2in;
      size: auto;
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.2;
      color: black;
      background: white;
      margin: 0;
      padding: 20px;
      white-space: pre;
    }
    @media print {
      body { margin: 0; }
    }
  </style>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</head>
<body>${content.replace(/\n/g, '<br>')}</body>
</html>`;

    await writeFile(filePath, new TextEncoder().encode(htmlContent));
    return filePath;
  } catch (err) {
    throw new Error(`Failed to create print file: ${err}`);
  }
}

export function isTauriEnvironment(): boolean {
  return !!window.__TAURI__;
}

// Fallback print method using iframe
export async function printInvoiceWithDataURL(content: string): Promise<void> {

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice</title>
  <style>
    @page {
      margin: 0.2in;
      size: auto;
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.2;
      color: black;
      background: white;
      margin: 0;
      padding: 20px;
      white-space: pre;
    }
    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>${content.replace(/\n/g, '<br>')}</body>
</html>`;

  try {
    // Create a temporary iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      // Wait for content to load, then print
      setTimeout(() => {
        if (iframe.contentWindow) {
          iframe.contentWindow.print();
        }
        // Remove iframe after printing
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);

    } else {
      throw new Error('Failed to access iframe document');
    }
  } catch {

    // Final fallback: Create download link
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.html`;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }
}
