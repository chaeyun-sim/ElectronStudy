const path = require('path');
const os = require('os');
const fs = require('fs');
const { app, BrowserWindow, Menu, ipcRenderer, ipcMain, shell } = require('electron');
const resizeImg = require('resize-img');  // npm

const isDev = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwinn';

// Create the Main Window
function createMainWindow() {
    const mainWindow = new BrowserWindow({
        title: 'Image Resizer',
        width: isDev ? 1000 : 500,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Open devtools if in dev env
    if (isDev){
        mainWindow.webContents.openDevTools();
    }

    mainWindow.loadFile(path.join(__dirname, "./renderer/index.html"));
};

// Create About Window
function createAboutWindow(){
    const aboutWindow = new BrowserWindow({
        title: 'About Image Resizer',
        width: 300,
        height: 300,
    });

    aboutWindow.loadFile(path.join(__dirname, "./renderer/about.html"));
}

// APP IS READY
app.whenReady().then(() => {
    createMainWindow();

    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0){
            createMainWindow();
        }
    })
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
    }] : [])
];

// Response to ipcRenderer resize
ipcMain.on('image;resize', (event, options) => {
    options.dest = path.join(os.homedir(), 'imageresizer')
    resizeImage(options);
});

// Resize Image function
async function resizeImage({ imgPath, width, height, dest }){
    try {
        const newPath = await resizeImg(fs.readFileSync(imgPath), {
            width: +width,  //convert to number
            height: +height,
        });

        // Create File Name
        const filename = path.basename(imgPath);

        // Create Destination Folder if not exists
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }

        // Write file to dest
        fs.writeFileSync(path.join(dest, filename), newPath);

        // Send success message to render
        mainWindow.webContents.send('image:done');
        // Open destination folder
        shell.openPath(dest);
    } catch (error) {
        console.log(error)
    }
};

app.on('window-all-closed', () => {
    if (!isMac) {
        app.quit();
    }
})