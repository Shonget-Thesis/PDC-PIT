# 🚀 Quick Start Guide

## Easiest Way to Start

### Option 1: Start Everything (Recommended)
Double-click `start-all.bat` in the project root. This will:
- Start the backend server in one window
- Start the frontend server in another window
- Automatically open both servers

### Option 2: Start Manually

#### Terminal 1 - Backend:
```bash
cd "Call me Backend"
pip install -r requirements.txt
python main.py
```

#### Terminal 2 - Frontend:
```bash
cd call_me
npm install
npm run dev
```

## Testing the Application

1. **Open the app**: Go to `http://localhost:3000`
2. **Open a second window**: Open another browser window/tab (or use incognito mode) and go to `http://localhost:3000`
3. **Start calls**: Click "Start Call" in both windows
4. **Grant permissions**: Allow microphone access when prompted
5. **Talk!**: Both users will be automatically matched and connected

For stress and failure testing, see `STRESS_TEST.md`.

## What You Should See

### Backend Console (Port 8000):
```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Frontend Console (Port 3000):
```
▲ Next.js 16.1.6
- Local:        http://localhost:3000
```

## Troubleshooting

### Backend won't start
- Make sure Python 3.8+ is installed: `python --version`
- Install dependencies: `pip install -r requirements.txt`

### Frontend won't start
- Make sure Node.js 18+ is installed: `node --version`
- Install dependencies: `npm install`

### Can't hear audio
- Allow microphone permissions in browser
- Check browser console for errors (F12)
- Make sure you're using HTTPS or localhost

### Connection fails
- Ensure both backend (8000) and frontend (3000) are running
- Check browser console for WebSocket errors
- Try disabling browser extensions

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Browser A     │         │  FastAPI Server  │         │   Browser B     │
│   :3000         │◄────────┤     :8000        ├────────►│   :3000         │
│                 │         │                  │         │                 │
│  WebRTC Client  │         │  WebSocket       │         │  WebRTC Client  │
└────────┬────────┘         │  Signaling       │         └────────┬────────┘
         │                  └──────────────────┘                  │
         │                                                         │
         │              Peer-to-Peer Audio Stream                 │
         └────────────────────────────────────────────────────────┘
```

## Features to Test

✅ **Start Call**: Click to find a random partner
✅ **Mute/Unmute**: Toggle your microphone
✅ **Skip**: Find a new partner
✅ **End Call**: Disconnect and stop
✅ **Connection States**: Watch the UI update as connection changes
✅ **Error Handling**: Try disconnecting one user and see what happens

## Development Tips

### Backend
- View server status: `http://localhost:8000`
- View API docs: `http://localhost:8000/docs`
- Logs show all WebSocket events and matches

### Frontend  
- Hot reload is enabled - changes auto-refresh
- Check browser console for WebRTC logs
- Network tab shows WebSocket messages

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore the code in `call_me/app/page.tsx` for frontend logic
- Check `Call me Backend/main.py` for backend signaling logic
- Try opening the app on multiple devices on the same network

---

**Have fun connecting! 🎤**
