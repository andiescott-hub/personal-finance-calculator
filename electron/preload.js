const { contextBridge } = require('electron');

// Expose protected methods that allow the renderer process to use
// specific Electron APIs without exposing the entire API
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  // Add more APIs here as needed
});
