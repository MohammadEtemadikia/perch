/**
 * Desktop shell for Perch.
 *
 * Starts the bundled Next.js server in-process using Electron's own Node
 * runtime, then shows it in a window. No Node/npm needs to be installed on
 * the machine for the app itself to run.
 *
 * All data lives in a local SQLite file under Electron's per-user data
 * directory (DB_DIR passed to the server process below) — nothing is sent
 * anywhere over the network.
 */
const { app, BrowserWindow, shell, dialog, Menu, ipcMain, utilityProcess } = require("electron");
const { execFile, spawnSync } = require("child_process");
const net = require("net");
const path = require("path");
const fs = require("fs");

const IS_WINDOWS = process.platform === "win32";
const IS_MAC = process.platform === "darwin";
const IS_LINUX = process.platform === "linux";

let serverProcess = null;
let serverExitCode = null;
let mainWindow = null;
let serverPort = 0;

/* -------------------------------------------------------------------------- */
/*  PATH REPAIR                                                               */
/* -------------------------------------------------------------------------- */

function loginShellPath() {
  if (IS_WINDOWS) return Promise.resolve(null);
  const shellBin = process.env.SHELL || "/bin/zsh";
  return new Promise((resolve) => {
    execFile(shellBin, ["-ilc", "command -p echo __PATH__:$PATH"], { timeout: 8000 }, (error, stdout) => {
      if (error || !stdout) return resolve(null);
      const match = /__PATH__:(.*)/.exec(stdout);
      resolve(match ? match[1].trim() : null);
    });
  });
}

async function repairPath() {
  const extras = IS_WINDOWS
    ? []
    : [
        "/opt/homebrew/bin",
        "/usr/local/bin",
        path.join(app.getPath("home"), ".local", "bin"),
        "/usr/bin",
        "/bin",
      ];
  const fromShell = await loginShellPath();
  const current = process.env.PATH || "";
  const merged = [...(fromShell ? fromShell.split(path.delimiter) : []), ...current.split(path.delimiter), ...extras];
  const seen = new Set();
  process.env.PATH = merged
    .map((entry) => entry.trim())
    .filter((entry) => entry && !seen.has(entry) && seen.add(entry))
    .join(path.delimiter);
}

/* -------------------------------------------------------------------------- */
/*  SERVER                                                                    */
/* -------------------------------------------------------------------------- */

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.unref();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

function serverEntry() {
  const packaged = path.join(process.resourcesPath, "server", "server.js");
  if (app.isPackaged) return packaged;
  const local = path.join(__dirname, "..", ".next", "standalone", "server.js");
  return fs.existsSync(local) ? local : packaged;
}

async function startServer() {
  const entry = serverEntry();
  if (!fs.existsSync(entry)) {
    throw new Error(
      `The application server is missing (expected at ${entry}).\n\nIf you are running from source, build it first:\n  npm run build:app`
    );
  }

  serverPort = await freePort();
  const dbDir = path.join(app.getPath("userData"), "data");
  fs.mkdirSync(dbDir, { recursive: true });

  // Runs the bundled Next.js server as a background utility process rather than
  // `child_process.spawn(process.execPath, ...)`: spawning Electron's own binary
  // that way still registers a second Dock icon on macOS, even with
  // ELECTRON_RUN_AS_NODE. utilityProcess is Electron's dedicated API for
  // background Node work and never shows up in the Dock or App Switcher.
  serverExitCode = null;
  serverProcess = utilityProcess.fork(entry, [], {
    cwd: path.dirname(entry),
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(serverPort),
      HOSTNAME: "127.0.0.1",
      DB_DIR: dbDir,
    },
    stdio: "pipe",
  });

  serverProcess.on("exit", (code) => {
    serverExitCode = code;
  });
  serverProcess.stdout?.on("data", (chunk) => process.stdout.write(`[server] ${chunk}`));
  serverProcess.stderr?.on("data", (chunk) => process.stderr.write(`[server] ${chunk}`));

  await waitForServer(`http://127.0.0.1:${serverPort}`);
  return `http://127.0.0.1:${serverPort}`;
}

async function waitForServer(url, attempts = 90) {
  for (let i = 0; i < attempts; i += 1) {
    if (serverProcess && serverExitCode !== null) {
      throw new Error(`The application server stopped unexpectedly (exit ${serverExitCode}).`);
    }
    try {
      const response = await fetch(url, { method: "HEAD" });
      if (response.status < 500) return;
    } catch {
      /* not up yet */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("The application server did not start in time.");
}

/* -------------------------------------------------------------------------- */
/*  WINDOW                                                                    */
/* -------------------------------------------------------------------------- */

const SPLASH = `data:text/html;charset=utf-8,${encodeURIComponent(`
<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{height:100%;margin:0;display:flex;align-items:center;justify-content:center;
    background:#0b0f14;color:#e6edf3;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
  .box{text-align:center}
  .dot{width:34px;height:34px;margin:0 auto 18px;border-radius:50%;
    border:3px solid #263241;border-top-color:#4f8cff;animation:s .9s linear infinite}
  @keyframes s{to{transform:rotate(360deg)}}
  p{margin:0;font-size:13px;color:#8b98a5}
  strong{display:block;margin-bottom:6px;font-size:15px;letter-spacing:.02em}
</style></head><body><div class="box"><div class="dot"></div>
<strong>Perch</strong><p>Starting…</p></div></body></html>`)}`;

function appIconPath() {
  const packaged = path.join(process.resourcesPath, "icon.png");
  if (app.isPackaged) return packaged;
  const local = path.join(__dirname, "..", "build", "icon.png");
  return fs.existsSync(local) ? local : packaged;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1520,
    height: 960,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    backgroundColor: "#0b0f14",
    title: "Perch",
    icon: appIconPath(),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());
  void mainWindow.loadURL(SPLASH);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(`http://127.0.0.1:${serverPort}`)) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  return mainWindow;
}

function buildMenu() {
  const template = [
    ...(IS_MAC ? [{ role: "appMenu" }] : []),
    { role: "fileMenu" },
    { role: "editMenu" },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
        { role: "toggleDevTools" },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/* -------------------------------------------------------------------------- */
/*  OS INTEGRATION (only real, working actions are exposed)                   */
/* -------------------------------------------------------------------------- */

ipcMain.handle("shell:pick-folder", async (_event, defaultPath) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    defaultPath: typeof defaultPath === "string" && fs.existsSync(defaultPath) ? defaultPath : undefined,
  });
  if (result.canceled || result.filePaths.length === 0) return { ok: false, canceled: true };
  return { ok: true, path: result.filePaths[0] };
});

ipcMain.handle("shell:open-path", async (_event, targetPath) => {
  if (typeof targetPath !== "string" || !targetPath) return { ok: false, reason: "No path provided." };
  if (!fs.existsSync(targetPath)) return { ok: false, reason: "Path does not exist on this machine." };
  const result = await shell.openPath(targetPath);
  return result ? { ok: false, reason: result } : { ok: true };
});

ipcMain.handle("shell:open-external", async (_event, url) => {
  if (typeof url !== "string" || !/^https?:\/\//.test(url)) {
    return { ok: false, reason: "Only http(s) URLs can be opened." };
  }
  await shell.openExternal(url);
  return { ok: true };
});

ipcMain.handle("shell:open-terminal", async (_event, targetPath) => {
  if (typeof targetPath !== "string" || !fs.existsSync(targetPath)) {
    return { ok: false, reason: "Path does not exist on this machine." };
  }
  if (IS_MAC) {
    const escaped = targetPath.replace(/"/g, '\\"');
    const script = `tell application "Terminal" to do script "cd \\"${escaped}\\""`;
    const result = spawnSync("osascript", ["-e", script]);
    if (result.status !== 0) return { ok: false, reason: result.stderr?.toString() || "Failed to open Terminal." };
    return { ok: true };
  }
  if (IS_WINDOWS) {
    const result = spawnSync("cmd.exe", ["/c", "start", "cmd.exe", "/k", `cd /d "${targetPath}"`]);
    if (result.status !== 0) return { ok: false, reason: "Failed to open a terminal window." };
    return { ok: true };
  }
  if (IS_LINUX) {
    // Best-effort: not every distro ships the same terminal emulator.
    for (const candidate of ["x-terminal-emulator", "gnome-terminal", "konsole", "xterm"]) {
      const result = spawnSync(candidate, ["--working-directory", targetPath], { stdio: "ignore" });
      if (!result.error) return { ok: true };
    }
    return { ok: false, reason: "No supported terminal emulator was found on this system." };
  }
  return { ok: false, reason: "Unsupported platform." };
});

ipcMain.handle("shell:run-command", async (_event, targetPath, command) => {
  if (typeof targetPath !== "string" || !fs.existsSync(targetPath)) {
    return { ok: false, reason: "Path does not exist on this machine." };
  }
  if (typeof command !== "string" || !command.trim()) {
    return { ok: false, reason: "No run command is known for this project (no dev/start script detected)." };
  }
  if (IS_MAC) {
    const escapedPath = targetPath.replace(/"/g, '\\"');
    const escapedCmd = command.replace(/"/g, '\\"');
    const script = `tell application "Terminal" to do script "cd \\"${escapedPath}\\" && ${escapedCmd}"`;
    const result = spawnSync("osascript", ["-e", script]);
    if (result.status !== 0) return { ok: false, reason: result.stderr?.toString() || "Failed to launch." };
    return { ok: true };
  }
  if (IS_WINDOWS) {
    const result = spawnSync("cmd.exe", ["/c", "start", "cmd.exe", "/k", `cd /d "${targetPath}" && ${command}`]);
    if (result.status !== 0) return { ok: false, reason: "Failed to launch." };
    return { ok: true };
  }
  return { ok: false, reason: "Running a project from the app is only implemented for macOS and Windows so far." };
});

/* -------------------------------------------------------------------------- */
/*  LIFECYCLE                                                                 */
/* -------------------------------------------------------------------------- */

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    if (IS_MAC && !app.isPackaged && app.dock) {
      // Packaged mac builds get their icon from the .app bundle automatically;
      // `electron .` in dev otherwise shows Electron's generic dock icon.
      app.dock.setIcon(appIconPath());
    }
    buildMenu();
    createWindow();
    try {
      await repairPath();
      const url = await startServer();
      await mainWindow?.loadURL(url);
    } catch (error) {
      dialog.showErrorBox("Perch could not start", error instanceof Error ? error.message : String(error));
      app.quit();
    }
  });

  app.on("window-all-closed", () => app.quit());

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0 && serverPort) {
      createWindow().loadURL(`http://127.0.0.1:${serverPort}`);
    }
  });

  app.on("before-quit", () => {
    if (serverProcess && serverExitCode === null) {
      serverProcess.kill();
    }
  });
}
