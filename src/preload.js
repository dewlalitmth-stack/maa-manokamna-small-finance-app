const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ledgerAPI', {
  load: () => ipcRenderer.invoke('load-data'),
  save: (data) => ipcRenderer.invoke('save-data', data),
  backup: () => ipcRenderer.invoke('create-backup'),
  backupPath: () => ipcRenderer.invoke('backup-path'),
  restore: () => ipcRenderer.invoke('restore-backup')
});
