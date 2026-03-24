import { ipcMain, type IpcMainInvokeEvent } from "electron";
import { IPC_CHANNELS } from "../../../shared/channels";
import { getSidecarClient, getSidecarPort } from "../../sidecar";

export const registerSidecarHandlers = (): void => {
  ipcMain.handle(
    IPC_CHANNELS.SIDECAR_STATUS,
    async (_event: IpcMainInvokeEvent) => {
      const client = getSidecarClient();
      const port = getSidecarPort();
      return {
        connected: client !== null,
        port,
      };
    }
  );
};
