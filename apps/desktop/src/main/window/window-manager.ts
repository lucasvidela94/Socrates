import { BrowserWindow } from "electron";
import * as path from "path";

const isDev = process.env.NODE_ENV === "development";

export const createMainWindow = (): BrowserWindow => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.once("ready-to-show", () => {
    win.show();
  });

  win.webContents.on("did-fail-load", (_, errorCode, errorDescription) => {
    console.error("Failed to load:", errorCode, errorDescription);
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    const htmlPath = path.join(__dirname, "../../../dist/renderer/index.html");
    win.loadFile(htmlPath);
  }

  return win;
};
