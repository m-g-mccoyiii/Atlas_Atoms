'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('steam', { achievement: name => ipcRenderer.invoke('steam:achievement', name) });
