const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

const dataFile = path.join(app.getPath('userData'), 'ledger.json');

function getBackupFolder() {
  return path.join(app.getPath('documents'), 'Maa Manokamna Backup');
}

function defaultData() {
  return {
    pin: '',
    customers: [],
    loans: [],
    payments: []
  };
}

function loadData() {
  try {
    if (!fs.existsSync(dataFile)) {
      return defaultData();
    }

    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

    return {
      pin: data.pin || '',
      customers: Array.isArray(data.customers) ? data.customers : [],
      loans: Array.isArray(data.loans) ? data.loans : [],
      payments: Array.isArray(data.payments) ? data.payments : []
    };
  } catch (error) {
    console.error('Load error:', error);
    return defaultData();
  }
}

function saveData(data) {
  const tempFile = dataFile + '.tmp';

  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempFile, dataFile);

  return true;
}

function createBackup() {
  try {
    if (!fs.existsSync(dataFile)) return null;

    const folder = getBackupFolder();
    fs.mkdirSync(folder, { recursive: true });

    const target = path.join(
      folder,
      `backup-${Date.now()}.json`
    );

    fs.copyFileSync(dataFile, target);
    return target;
  } catch (error) {
    console.error('Backup error:', error);
    return null;
  }
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

ipcMain.handle('load-data', () => loadData());

ipcMain.handle('save-data', (_event, data) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data');
  }
  return saveData(data);
});

ipcMain.handle('create-backup', () => createBackup());

ipcMain.handle('backup-path', () => getBackupFolder());

ipcMain.handle('restore-backup', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'JSON Backup', extensions: ['json'] }]
  });

  if (result.canceled || !result.filePaths.length) {
    return null;
  }

  try {
    const restored = JSON.parse(
      fs.readFileSync(result.filePaths[0], 'utf8')
    );

    if (
      !Array.isArray(restored.customers) ||
      !Array.isArray(restored.loans) ||
      !Array.isArray(restored.payments)
    ) {
      throw new Error('Invalid backup file');
    }

    saveData(restored);
    return true;
  } catch (error) {
    console.error('Restore error:', error);
    dialog.showErrorBox('Restore Failed', 'यह बैकअप फाइल सही नहीं है।');
    return false;
  }
});

app.whenReady().then(() => {
  createWindow();

  setInterval(() => {
    createBackup();
  }, 15 * 60 * 1000);
});

app.on('before-quit', () => {
  createBackup();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
