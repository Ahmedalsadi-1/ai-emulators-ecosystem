import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  navigateTo: (url: string) => ipcRenderer.send("navigate-to", url),
});
