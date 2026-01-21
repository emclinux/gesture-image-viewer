# Gesture Slideshow

A Node.js/Electron-based image slideshow application with GUI interface for displaying images in random order with customizable display duration and session controls.

## Features

- **GUI Interface**: User-friendly setup dialog
- **Directory Browsing**: Browse button to select image directory
- **Duration Controls**: Number input with seconds/minutes/hours dropdown
- **Session Modes**: Choose between infinite, count-based, or time-based sessions
- **Random Display**: Images shown in random order
- **Fullscreen Mode**: Immersive image viewing experience
- **Countdown Timer**: Shows time remaining until next image
- **Session Details**: Real-time display of session information
- **Auto-loop**: Restarts with new random order when complete
- **ESC to Exit**: Easy way to close the viewer
- **Settings Persistence**: Remembers last used settings

## Installation

1. Install dependencies:
```bash
npm install
```

## Usage

1. Start the application:
```bash
npm start
```

2. In the setup dialog:
   - Click "Browse..." to select a directory containing images
   - Set the display duration (number + seconds/minutes/hours)
   - Choose session mode:
     - **Infinite**: Runs continuously until you exit
     - **Number of Images**: Shows exactly X images then stops
     - **Session Length**: Runs for X minutes/hours then stops
   - View session details showing estimated duration and image count
   - Click "Start" to begin the slideshow

3. During viewing:
   - Images display fullscreen in random order
   - Countdown timer shows time until next image
   - Hover to see filename and exit instructions
   - Press ESC to exit at any time

## Supported Image Formats

- JPG/JPEG
- PNG
- GIF
- BMP
- TIFF
- WebP

## Requirements

- Node.js (v14 or higher)
- npm
- Supports Windows, macOS, and Linux

## File Structure

- `image-viewer.js` - Main Electron application
- `setup.html` - Setup dialog interface
- `viewer.html` - Fullscreen image viewer
- `package.json` - Node.js dependencies and scripts
- `settings.json` - Saved user preferences (auto-generated)
