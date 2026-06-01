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

const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  // Remove default Electron menu for a cleaner app look
  Menu.setApplicationMenu(null);

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
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
  });

  if (app.isPackaged) {
    // Production: load built files, no DevTools
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  } else {
    // Development: load Vite dev server with DevTools
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});