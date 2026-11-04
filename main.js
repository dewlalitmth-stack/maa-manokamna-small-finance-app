const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs'); const path = require('path');
let win;
const dataDir = path.join(app.getPath('userData'), 'data');
const dataFile = path.join(dataDir, 'ledger.json');
const backupDir = path.join(app.getPath('documents'), 'Maa Manokamna Backup');
const empty = () => ({ pin: '', customers: [], loans: [], payments: [] });
function ensure(){ fs.mkdirSync(dataDir,{recursive:true}); fs.mkdirSync(backupDir,{recursive:true}); if(!fs.existsSync(dataFile)) fs.writeFileSync(dataFile,JSON.stringify(empty(),null,2)); }
function read(){ ensure(); try{return JSON.parse(fs.readFileSync(dataFile,'utf8'));}catch{return empty();} }
function write(d){ ensure(); const tmp=dataFile+'.tmp'; fs.writeFileSync(tmp,JSON.stringify(d,null,2)); fs.renameSync(tmp,dataFile); return true; }
function backup(){ ensure(); const stamp=new Date().toISOString().replace(/[:.]/g,'-'); fs.copyFileSync(dataFile,path.join(backupDir,`backup-${stamp}.json`)); }
function create(){ win=new BrowserWindow({width:1360,height:900,minWidth:1000,minHeight:700,webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false}}); win.loadFile(path.join(__dirname,'index.html')); }
app.whenReady().then(()=>{ensure();create();setInterval(()=>{try{backup()}catch(e){}},15*60*1000);});
app.on('before-quit',()=>{try{backup()}catch(e){}});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
ipcMain.handle('load',()=>read());
ipcMain.handle('save',(_,d)=>write(d));
ipcMain.handle('backup',()=>{backup();return backupDir;});
ipcMain.handle('restore',async()=>{const r=await dialog.showOpenDialog(win,{title:'बैकअप चुनें',defaultPath:backupDir,filters:[{name:'JSON Backup',extensions:['json']}],properties:['openFile']});if(r.canceled||!r.filePaths[0])return false;const parsed=JSON.parse(fs.readFileSync(r.filePaths[0],'utf8'));if(!Array.isArray(parsed.customers)||!Array.isArray(parsed.loans)||!Array.isArray(parsed.payments))throw new Error('अमान्य बैकअप फाइल');write(parsed);return true;});
ipcMain.handle('backup-path',()=>backupDir);
