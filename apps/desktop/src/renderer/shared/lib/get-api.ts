import { toast } from "sonner";
import type { ElectronAPI } from "@shared/types";

export const getApi = (): ElectronAPI => {
  if (typeof window.electronAPI === "undefined") {
    toast.error("La aplicación no está lista. Reiniciá Sócrates.");
    throw new Error("electronAPI not available");
  }
  return window.electronAPI;
};
