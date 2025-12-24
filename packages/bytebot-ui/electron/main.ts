import { app, BrowserWindow, shell, ipcMain } from "electron";
import * as path from "path";

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === "development";

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    frame: false,
    transparent: true,
    resizable: true,
    backgroundColor: "#000000",
    webPreferences: {
      preload: path.join(__dirname, "electron/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:9992");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();
});

app.on("window-all-closed", () => {
  mainWindow = null;
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Handle external links
app.on("web-contents-created", (_event, contents) => {
  contents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });
});

// Handle navigation commands from renderer
ipcMain.on("navigate-to", (_event, url: string) => {
  if (mainWindow) {
    if (isDev) {
      mainWindow.loadURL(`http://localhost:9992${url}`);
    } else {
      mainWindow.loadFile(path.join(__dirname, `../dist/index.html#${url}`));
    }
  }
});
