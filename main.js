const { app, BrowserWindow, ipcMain } = require('electron');
const { download } = require('electron-dl');
const path = require('path');
const fs = require('fs');

if (fs.existsSync(`${__dirname}/data`) === false) {
  fs.mkdir(`${__dirname}/data`, (e) => {});
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1025,
    height: 1010,
    hasShadow: true,
    autoHideMenuBar: true,
    icon: `${__dirname}/favicon.ico`,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile('index.html');

  return mainWindow;
}

app.whenReady().then(() => {
  const mainWindow = createWindow();

  ipcMain.handle('download', async (event, info) => {
    info.properties.onProgress = (status) =>
      mainWindow.webContents.send('download progress', status);
    const dl = await download(
      BrowserWindow.getFocusedWindow(),
      info.url,
      info.properties
    );
    const savePath = dl.getSavePath();
    mainWindow.webContents.send('download complete', dl.getSavePath());
    return savePath;
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
