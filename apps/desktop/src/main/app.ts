import { app, BrowserWindow } from "electron";
import { createMainWindow } from "./window/window-manager";
import { setupMenu } from "./window/menu";
import { registerIpcHandlers } from "./ipc";
import { initializeDatabase, closeDatabase } from "./db";
import { startSidecar, stopSidecar } from "./sidecar";

const PLATFORM = {
  DARWIN: "darwin"
} as const;

export const initializeApp = (): void => {
  app.whenReady().then(async () => {
    await initializeDatabase();
    registerIpcHandlers();
    setupMenu();
    createMainWindow();

    startSidecar().catch((err) => {
      console.error("Failed to start sidecar:", err);
    });

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== PLATFORM.DARWIN) {
      app.quit();
    }
  });

  app.on("before-quit", async () => {
    stopSidecar();
    await closeDatabase();
  });
};
