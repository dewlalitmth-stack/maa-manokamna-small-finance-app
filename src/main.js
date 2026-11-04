const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function getBackupFolder() {
  return path.join(app.getPath('documents'), 'Maa Manokamna Backup');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 650,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

function createBackup() {
  try {
    const folder = getBackupFolder();
    fs.mkdirSync(folder, { recursive: true });

    const source = path.join(__dirname, 'data.json');
    if (fs.existsSync(source)) {
      const target = path.join(folder, `backup-${Date.now()}.json`);
      fs.copyFileSync(source, target);
    }
  } catch (error) {
    console.error('Backup error:', error);
  }
}

app.whenReady().then(() => {
  createWindow();
  setInterval(createBackup, 15 * 60 * 1000);
});

app.on('before-quit', () => {
  createBackup();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('save-backup', async (_event, data) => {
  const folder = getBackupFolder();
  fs.mkdirSync(folder, { recursive: true });
  const file = path.join(folder, `backup-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  return file;
});

ipcMain.handle('restore-backup', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'JSON Backup', extensions: ['json'] }]
  });
  if (result.canceled || !result.filePaths.length) return null;
  return fs.readFileSync(result.filePaths[0], 'utf8');
});
