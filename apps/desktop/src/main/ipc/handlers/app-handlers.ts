import { app, ipcMain, type IpcMainInvokeEvent } from "electron";
import { IPC_CHANNELS } from "../../../shared/channels";

export const registerAppHandlers = (): void => {
  ipcMain.handle(
    IPC_CHANNELS.GET_APP_INFO,
    async (_event: IpcMainInvokeEvent) => {
      return {
        name: app.getName(),
        version: app.getVersion()
      };
    }
  );
};
