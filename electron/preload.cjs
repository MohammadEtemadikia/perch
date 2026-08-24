const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("perch", {
  isElectron: true,
  pickFolder: (defaultPath) => ipcRenderer.invoke("shell:pick-folder", defaultPath),
  openPath: (targetPath) => ipcRenderer.invoke("shell:open-path", targetPath),
  openExternal: (url) => ipcRenderer.invoke("shell:open-external", url),
  openTerminal: (targetPath) => ipcRenderer.invoke("shell:open-terminal", targetPath),
  runCommand: (targetPath, command) => ipcRenderer.invoke("shell:run-command", targetPath, command),
});
