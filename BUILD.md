# Building Gesture Slideshow for macOS

This guide will help you package Gesture Slideshow as a native macOS application.

## Prerequisites

- Node.js (v14 or higher)
- npm
- macOS (for building macOS app)

## Build Setup

The project is already configured with `electron-builder` for packaging. The configuration includes:

- **App ID**: `com.gestureslideshow.app`
- **Product Name**: `Gesture Slideshow`
- **Category**: Graphics & Design
- **Target**: DMG installer for both Intel (x64) and Apple Silicon (arm64)

## Building Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Build for macOS
```bash
npm run build-mac
```

This will create a DMG installer in the `dist/` folder.

### 3. Alternative Build Commands
```bash
# Build for current platform
npm run build

# Build for all platforms
npm run dist
```

## Output

After building, you'll find:
- `dist/Gesture Slideshow-1.0.0.dmg` - macOS installer
- `dist/Gesture Slideshow.app` - macOS application bundle

## Installing the App

1. Open the DMG file
2. Drag "Gesture Slideshow" to your Applications folder
3. Launch from Applications or Spotlight

## Code Signing (Optional)

For distribution, you may want to code sign the app:

```bash
# Add to package.json build.mac section:
"identity": "Developer ID Application: Your Name (TEAM_ID)"
```

## Notarization (Optional for Distribution)

For App Store or outside distribution, notarization is required. This requires an Apple Developer account.

## Icon

The app will use the default Electron icon. To add a custom icon:
1. Create an `icon.icns` file in the project root
2. Rebuild with `npm run build-mac`

## Troubleshooting

- **Build fails**: Ensure all dependencies are installed with `npm install`
- **App won't open**: Check macOS Gatekeeper settings
- **Performance**: The app includes native binaries for image processing

## Distribution

The generated DMG can be distributed to users. They can simply:
1. Download the DMG
2. Open it
3. Drag the app to Applications
4. Run the app
