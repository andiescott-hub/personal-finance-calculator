# Personal Finance App - Electron Desktop Version

Your Next.js finance app is now set up as a desktop application! 🎉

## Running the App

### Development Mode (Recommended while building features)
```bash
npm run electron:dev
```
This will:
- Start the Next.js dev server
- Launch the Electron desktop app
- Enable hot reloading (changes appear instantly)
- Open DevTools for debugging

### Production Mode (Quick launch from terminal)
```bash
npm run dev        # In one terminal
npm run electron   # In another terminal
```

## Building a Standalone App

### Create a Mac Application (.app file)
```bash
npm run electron:build:mac
```
This creates `dist/Personal Finance.app` that you can:
- Drag to your Applications folder
- Launch from Spotlight
- Pin to your Dock

The app will be in the `dist/` folder when complete (~150MB).

## What Changed?

### New Files
- `electron/main.js` - Electron main process (window management)
- `electron/preload.js` - Security layer
- `package.json` - Added Electron scripts and config

### What Stayed the Same
- All your React components (`app/`, `lib/`, `components/`)
- All functionality and features
- Development workflow with Claude Code

## How to Develop

You can still work **exactly the same way**:

1. **Browser Development** (during active coding):
   ```bash
   npm run dev
   ```
   Then open http://localhost:3000 in your browser

2. **Desktop Development** (to test desktop features):
   ```bash
   npm run electron:dev
   ```
   App opens in a window

3. **Modify anything** - I (Claude Code) can still edit all files!

## Customization

### Change Window Size
Edit `electron/main.js`, line 9-10:
```javascript
width: 1400,  // Change to your preferred width
height: 900,  // Change to your preferred height
```

### Add Custom Icon
1. Create an icon file (1024x1024 PNG)
2. Convert to `.icns` format (use https://cloudconvert.com)
3. Place in `assets/icon.icns`
4. Rebuild: `npm run electron:build:mac`

### Remove DevTools Auto-Open
Edit `electron/main.js`, line 31-33:
```javascript
// Comment out or remove these lines:
// if (isDev) {
//   mainWindow.webContents.openDevTools({ mode: 'detach' });
// }
```

## Troubleshooting

### "Port 3000 already in use"
Kill any running Next.js servers:
```bash
lsof -ti:3000 | xargs kill -9
```

### "App won't open" (macOS Gatekeeper)
Right-click the app → Open → Click "Open" in the security dialog

### Hot Reload Not Working
Restart the electron:dev process

## Benefits of Desktop App

✅ Launches from Dock
✅ Separate window (doesn't clutter browser tabs)
✅ Native feel with titlebar controls
✅ Can add desktop features later (notifications, file system, etc.)
✅ Works offline once built
✅ Professional appearance

## Still Need Help?

Everything works the same - just ask me (Claude Code) to modify any features!
