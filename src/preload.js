const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('financeAPI', {
  saveBackup: (data) => ipcRenderer.invoke('save-backup', data),
  restoreBackup: () => ipcRenderer.invoke('restore-backup')
});
