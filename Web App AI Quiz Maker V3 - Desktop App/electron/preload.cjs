/**
 * Electron Preload Script
 * 
 * Exposes a secure bridge between the renderer (frontend) and Electron.
 * Provides:
 * 1. `window.electronAPI.getAppMode()` — Returns 'desktop' when running in Electron
 * 2. `window.electronAPI.platform` — Current OS platform
 * 
 * This allows the frontend to detect Electron environment without
 * exposing Node.js or Electron internals.
 */

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Always return 'desktop' when running in Electron
  getAppMode: () => 'desktop',
  // Expose platform info
  platform: process.platform,
  // Check if we're in Electron
  isElectron: true,
});