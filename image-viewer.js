const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { pathToFileURL } = require('url');
const sharp = require('sharp');

let setupWindow;
let viewerWindow;
let imageFiles = [];
let currentImageIndex = 0;
let displayInterval;
let displayDuration = 60000;
let sessionSettings = { mode: 'infinite' };
let imagesShown = 0;
let sessionStartTime;
let sessionEndTime;

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'];
const CONFIG_FILE = path.join(__dirname, 'settings.json');
const imageCountCache = new Map();

// Load saved settings
async function loadSettings() {
    try {
        const data = await fs.readFile(CONFIG_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {
            directory: '',
            duration: 1,
            unit: 'minutes',
            sessionMode: 'infinite',
            imageCount: 10,
            sessionLength: 30,
            sessionUnit: 'minutes'
        };
    }
}

// Save settings
async function saveSettings(settings) {
    try {
        await fs.writeFile(CONFIG_FILE, JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

function createSetupWindow() {
    setupWindow = new BrowserWindow({
        width: 480,
        height: 820,
        title: 'Gesture Slideshow Setup',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        resizable: false
    });

    setupWindow.loadFile('setup.html');
    setupWindow.on('closed', () => { setupWindow = null; });
}

function createViewerWindow() {
    viewerWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: 'Gesture Slideshow',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        fullscreen: true,
        backgroundColor: '#000000'
    });

    viewerWindow.loadFile('viewer.html');
    viewerWindow.on('closed', () => {
        viewerWindow = null;
        if (displayInterval) clearInterval(displayInterval);
    });

    viewerWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'Escape') {
            viewerWindow.close();
        } else if (input.key === 'ArrowRight') {
            event.preventDefault();
            showManualNextImage();
        } else if (input.key === 'ArrowLeft') {
            event.preventDefault();
            showPreviousImage();
        }
    });
}

async function findImageFiles(directory, allowedSubdirs) {
    try {
        const files = [];
        const entries = await fs.readdir(directory, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                const allowed = !allowedSubdirs || allowedSubdirs.has(fullPath);
                if (allowed) {
                    files.push(...await findImageFiles(fullPath, allowedSubdirs));
                }
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (IMAGE_EXTENSIONS.includes(ext)) files.push(fullPath);
            }
        }
        return files;
    } catch (error) {
        console.error('Error reading directory:', error);
        return [];
    }
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function getImageCountCacheKey(directory, allowedSubdirs) {
    if (!allowedSubdirs || allowedSubdirs.size === 0) return directory;
    const sorted = [...allowedSubdirs].sort();
    return `${directory}|${sorted.join(';')}`;
}

function showImage(index) {
    const imagePath = imageFiles[index];
    const fileName = path.basename(imagePath);

    viewerWindow.webContents.send('display-image', { 
        src: pathToFileURL(imagePath).href, 
        fileName,
        duration: displayDuration
    });

    console.log(`Displaying: ${fileName} (${imagesShown + 1}${sessionSettings.mode === 'count' ? '/' + sessionSettings.count : ''})`);
}

function startAutoAdvanceTimer() {
    if (displayInterval) clearInterval(displayInterval);
    displayInterval = setInterval(displayNextImage, displayDuration);
}

async function displayNextImage() {
    if (imageFiles.length === 0) return;
    
    // Check session limits
    if (sessionSettings.mode === 'count' && imagesShown >= sessionSettings.count) {
        console.log('Session completed: Maximum image count reached');
        endSession();
        return;
    }
    
    if (sessionSettings.mode === 'time' && Date.now() >= sessionEndTime) {
        console.log('Session completed: Time limit reached');
        endSession();
        return;
    }
    
    if (currentImageIndex >= imageFiles.length) {
        imageFiles = shuffleArray(imageFiles);
        currentImageIndex = 0;
    }
    
    try {
        showImage(currentImageIndex);
        currentImageIndex++;
        imagesShown++;
        
    } catch (error) {
        console.error(`Error displaying ${imageFiles[currentImageIndex] || ''}:`, error);
        displayNextImage();
    }
}

function showManualNextImage() {
    if (!viewerWindow || imageFiles.length === 0) return;

    if (currentImageIndex >= imageFiles.length) {
        imageFiles = shuffleArray(imageFiles);
        currentImageIndex = 0;
    }

    showImage(currentImageIndex);
    currentImageIndex++;

    startAutoAdvanceTimer();
}

function showPreviousImage() {
    if (!viewerWindow || imageFiles.length === 0) return;

    // Move back one image (wrap around)
    currentImageIndex = (currentImageIndex - 1 + imageFiles.length) % imageFiles.length;
    showImage(currentImageIndex);

    startAutoAdvanceTimer();
}

function endSession() {
    if (displayInterval) {
        clearInterval(displayInterval);
    }
    
    // Show session complete message
    viewerWindow.webContents.send('session-complete');
    
    // Close viewer after a delay
    setTimeout(() => {
        if (viewerWindow) {
            viewerWindow.close();
        }
    }, 3000);
}

// Setup IPC handlers when app is ready
function setupIpcHandlers() {
    ipcMain.handle('select-directory', async () => {
        const result = await dialog.showOpenDialog(setupWindow, {
            properties: ['openDirectory'],
            title: 'Select Image Directory'
        });
        return result.canceled ? null : result.filePaths[0];
    });

    ipcMain.handle('load-settings', async () => {
        return await loadSettings();
    });

    ipcMain.handle('get-image-count', async (event, { directory, includeSubdirs }) => {
        const allowedSubdirs = new Set(includeSubdirs || []);
        allowedSubdirs.add(directory);

        const cacheKey = getImageCountCacheKey(directory, allowedSubdirs);
        if (imageCountCache.has(cacheKey)) {
            return imageCountCache.get(cacheKey);
        }

        const files = await findImageFiles(directory, allowedSubdirs);
        imageCountCache.set(cacheKey, files.length);
        return files.length;
    });

    ipcMain.handle('list-subdirectories', async (event, directory) => {
        try {
            const entries = await fs.readdir(directory, { withFileTypes: true });
            return entries
                .filter(entry => entry.isDirectory())
                .map(entry => ({
                    name: entry.name,
                    path: path.join(directory, entry.name)
                }));
        } catch (error) {
            console.error('Error listing subdirectories:', error);
            return [];
        }
    });

    ipcMain.handle('start-viewer', async (event, { directory, duration, unit, session, includeSubdirs }) => {
        // Save current settings
        await saveSettings({ 
            directory, 
            duration, 
            unit,
            sessionMode: session.mode,
            imageCount: session.count || 10,
            sessionLength: session.length || 30,
            sessionUnit: session.unit || 'minutes'
        });
        
        displayDuration = unit === 'seconds' ? duration * 1000 : 
                     unit === 'minutes' ? duration * 60 * 1000 : 
                     duration * 60 * 60 * 1000;
        sessionSettings = session;
        imagesShown = 0;
        sessionStartTime = Date.now();
        
        // Calculate session end time for time-based sessions
        if (session.mode === 'time') {
            const lengthMs = session.unit === 'hours' ? 
                session.length * 60 * 60 * 1000 : 
                session.length * 60 * 1000;
            sessionEndTime = sessionStartTime + lengthMs;
        }
        
        console.log(`Searching for images in: ${directory}`);
        const allowedSubdirs = new Set(includeSubdirs || []);
        allowedSubdirs.add(directory);

        const cacheKey = getImageCountCacheKey(directory, allowedSubdirs);
        imageFiles = await findImageFiles(directory, allowedSubdirs);
        imageCountCache.set(cacheKey, imageFiles.length);
        
        if (imageFiles.length === 0) {
            return { success: false, message: 'No image files found.' };
        }
        
        console.log(`Found ${imageFiles.length} image files`);
        console.log(`Session mode: ${session.mode}`);
        if (session.mode === 'count') {
            console.log(`Will show ${session.count} images`);
        } else if (session.mode === 'time') {
            console.log(`Session length: ${session.length} ${session.unit}`);
        }
        
        imageFiles = shuffleArray(imageFiles);
        
        setupWindow.close();
        createViewerWindow();
        
        setTimeout(() => {
            displayNextImage();
            startAutoAdvanceTimer();
        }, 1000);
        
        return { success: true };
    });

    ipcMain.handle('cancel-setup', () => {
        if (setupWindow) setupWindow.close();
        app.quit();
    });

    ipcMain.on('resize-setup', (event, { height }) => {
        if (!setupWindow || !height) return;
        const [width] = setupWindow.getSize();
        const clampedHeight = Math.min(Math.max(600, Math.round(height)), 1200);
        setupWindow.setSize(width, clampedHeight);
    });
}

app.whenReady().then(() => {
    setupIpcHandlers();
    createSetupWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createSetupWindow();
});
