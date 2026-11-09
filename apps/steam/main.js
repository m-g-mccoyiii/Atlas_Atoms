'use strict';
// Electron shell. UNTESTED: Node and Electron were not installed on the machine this was written on.
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let steam = null;
try { steam = require('steamworks.js').init(480); } catch (e) { console.warn('Steam not available, running without it:', e.message); }   // 480 = Spacewar test id; replace with the real app id

function create() {
  const win = new BrowserWindow({
    width: 1400, height: 900, backgroundColor: '#1b1f27',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.setMenuBarVisibility(false);
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', e => e.preventDefault());
  win.loadFile(path.join(__dirname, 'stage', 'apps', 'steam', 'index.html'));
}

ipcMain.handle('steam:achievement', (_e, name) => {
  if (!steam || typeof name !== 'string' || !/^[A-Z_]{3,40}$/.test(name)) return false;
  try { return steam.achievement.activate(name); } catch (e) { return false; }
});

app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());
