const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('ledgerAPI',{load:()=>ipcRenderer.invoke('load'),save:d=>ipcRenderer.invoke('save',d),backup:()=>ipcRenderer.invoke('backup'),restore:()=>ipcRenderer.invoke('restore'),backupPath:()=>ipcRenderer.invoke('backup-path')});
