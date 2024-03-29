const path = require('path');
const os = require('os');
const fs = require('fs');
const resizeImg = require('resize-img');
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');

const isDev = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';

let mainWindow;
let aboutWindow;


// Create the Main Window
function createMainWindow() {
    mainWindow = new BrowserWindow({
      width: isDev ? 1000 : 500,
      height: 600,
      icon: `${__dirname}/assets/icons/Icon_256x256.png`,
      resizable: isDev,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
    });
  
    // Show devtools automatically if in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
  }

// Create About Window
function createAboutWindow() {
    aboutWindow = new BrowserWindow({
        width: 300,
        height: 300,
        title: 'About Electron',
        icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    });
  
    aboutWindow.loadFile(path.join(__dirname, './renderer/about.html'));
  }

// APP IS READY
// app.whenReady().then(() => {
app.on('ready', () => {
    createMainWindow();
      
    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);
      
    // Remove variable from memory
    mainWindow.on('closed', () => (mainWindow = null));
});

// Menu Template
const menu = [
    ...(isMac ? [{
        label: app.name,
        submenu: [
            {
                label: 'About',
                click: createAboutWindow
            }
        ]
    }] : []),
    {
        role: 'fileMenu'
    },
    ...(!isMac ? [{
        label: 'Help',
        submenu: [{
            label: 'About',
            click: createAboutWindow
        }]
    }] : []),
    ...(isDev ? [
        {
            label: 'Developer',
            submenu: [
                { role: 'reload' },
                { role: 'forcereload' },
                { type: 'separator' },
                { role: 'toggledevtools' },
            ]
        }
    ] : []),
];

// Response to ipcRenderer resize
ipcMain.on('image:resize', (e, options) => {
    options.dest = path.join(os.homedir(), '/Documents/ElectronStudy/imageResizer/uploads');
    resizeImage(options);
  });

// Resize Image function
async function resizeImage({ imgPath, height, width, dest }) {
    try {  
      // Resize image
      const newPath = await resizeImg(fs.readFileSync(imgPath), {
        width: +width,
        height: +height,
      });
  
      // Get filename
      const filename = path.basename(imgPath);
  
      // Create destination folder if it doesn't exist
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest);
      }
  
      // Write the file to the destination folder
      fs.writeFileSync(path.join(dest, filename), newPath);
  
      // Send success to renderer
      mainWindow.webContents.send('image:done');
  
      // Open the folder in the file explorer
      shell.openPath(dest);
    } catch (err) {
      console.log(err);
    }
}

app.on('window-all-closed', () => {
    if (!isMac) app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});