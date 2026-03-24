import { Menu, MenuItemConstructorOptions, BrowserWindow } from "electron";
import { ROUTES } from "../../shared/lib/routes";

export const setupMenu = (): void => {
  const template: MenuItemConstructorOptions[] = [
    {
      label: "Archivo",
      submenu: [
        {
          label: "Inicio",
          accelerator: "CmdOrCtrl+H",
          click: () => navigateTo(ROUTES.HOME)
        },
        { type: "separator" },
        {
          label: "Cerrar",
          accelerator: "CmdOrCtrl+W",
          role: "close"
        }
      ]
    },
    {
      label: "Ver",
      submenu: [
        {
          label: "Recargar",
          accelerator: "CmdOrCtrl+R",
          click: (_, focusedWindow) => {
            if (focusedWindow instanceof BrowserWindow) {
              focusedWindow.reload();
            }
          }
        },
        {
          label: "Herramientas de desarrollo",
          accelerator: process.platform === "darwin" ? "Alt+Cmd+I" : "Ctrl+Shift+I",
          click: (_, focusedWindow) => {
            if (focusedWindow instanceof BrowserWindow) {
              focusedWindow.webContents.toggleDevTools();
            }
          }
        },
        { type: "separator" },
        {
          label: "Pantalla completa",
          accelerator: process.platform === "darwin" ? "Ctrl+Cmd+F" : "F11",
          click: (_, focusedWindow) => {
            if (focusedWindow instanceof BrowserWindow) {
              const isFullScreen = focusedWindow.isFullScreen();
              focusedWindow.setFullScreen(!isFullScreen);
            }
          }
        }
      ]
    },
    {
      label: "Ventana",
      submenu: [
        {
          label: "Minimizar",
          accelerator: "CmdOrCtrl+M",
          role: "minimize"
        },
        {
          label: "Cerrar",
          accelerator: "CmdOrCtrl+W",
          role: "close"
        }
      ]
    },
    {
      label: "Ayuda",
      submenu: [
        {
          label: "Acerca de Sócrates",
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (win !== null) {
              void win.webContents.executeJavaScript(`
                alert("Sócrates\\n\\nAsistente docente con IA (en desarrollo)");
              `);
            }
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

const navigateTo = (route: string): void => {
  const win = BrowserWindow.getFocusedWindow();
  if (win !== null) {
    void win.webContents.executeJavaScript(`
      window.location.hash = "${route}";
    `);
  }
};
