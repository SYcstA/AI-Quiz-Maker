/**
 * Electron Main Process
 * 
 * Entry point for the desktop application.
 * In development: loads Vite dev server (localhost:5173)
 * In production: loads dist/index.html
 * 
 * DevTools only open in development (app.isPackaged === false).
 * Application menu removed for cleaner UI.
 */

const { app, BrowserWindow, Menu, globalShortcut } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  // Remove default Electron menu for a cleaner app look
  Menu.setApplicationMenu(null);

  // Determine icon path for both dev and production
  const iconPath = path.join(__dirname, '..', 'icon-256.png');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'AI Quiz Maker',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
    icon: iconPath,
  });

  if (app.isPackaged) {
    // Production: load built files
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  } else {
    // Development: load Vite dev server with DevTools
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  createWindow();

  // Register F12 to toggle DevTools in both dev and production
  globalShortcut.register('F12', () => {
    if (mainWindow) {
      mainWindow.webContents.toggleDevTools();
    }
  });
});

app.on('will-quit', () => {
  // Unregister all shortcuts when app quits
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
