# Call Me - Anonymous Voice Chat Platform

A web-based anonymous voice chat platform that connects random strangers in real-time voice conversations. Built with Next.js, TypeScript, FastAPI, and WebRTC.

## Features

- 🎤 **Real-time Voice Chat**: Peer-to-peer audio communication using WebRTC
- 🔄 **Random Matching**: Connect with random strangers instantly
- 🎭 **Anonymous**: No sign-up or authentication required
- ⏭️ **Skip Functionality**: Move to the next person anytime
- 🔇 **Mute/Unmute**: Control your microphone during calls
- 🎨 **Beautiful UI**: Dark green theme inspired by modern design
- ⚡ **Low Latency**: Direct peer-to-peer connections
- 🔒 **Privacy Focused**: No data storage or user tracking

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **WebRTC API** - Peer-to-peer audio communication
- **WebSocket** - Real-time signaling
- **Lucide React** - Icon library

### Backend
- **FastAPI** - Modern Python web framework
- **WebSockets** - Real-time bidirectional communication
- **Uvicorn** - ASGI server
- **In-memory state** - No database required

## Architecture

### System Design
```
┌─────────────┐         WebSocket          ┌─────────────┐
│   Client A  │◄─────► Signaling Server ◄─────►│   Client B  │
└─────────────┘                               └─────────────┘
      │                                              │
      │           WebRTC Peer-to-Peer              │
      └──────────────► Audio Stream ◄──────────────┘
```

### Components

1. **Signaling Server (FastAPI)**
   - Manages WebSocket connections
   - Handles user matching queue
   - Routes WebRTC signaling messages (SDP, ICE candidates)
   - Manages session state

2. **Frontend Client (Next.js)**
   - Handles user interface
   - Manages WebRTC peer connections
   - Captures and streams audio
   - Processes incoming audio

3. **WebRTC**
   - Peer-to-peer audio transmission
   - NAT traversal using STUN servers
   - Low-latency communication

## Getting Started

### Prerequisites
- **Node.js 18+** and npm/pnpm
- **Python 3.8+** and pip
- Modern browser with WebRTC support

### Backend Setup

1. Navigate to the backend folder:
```bash
cd "Call me Backend"
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Start the FastAPI server:
```bash
python main.py
```

The backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend folder:
```bash
cd call_me
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Start the development server:
```bash
npm run dev
# or
pnpm dev
```

The frontend will run on `http://localhost:3000`

### Testing the Application

1. Open `http://localhost:3000` in two different browser windows (or use incognito mode)
2. Click "Start Call" in both windows
3. Grant microphone permissions when prompted
4. Both users will be matched and connected automatically
5. Start talking!

## Usage

### Starting a Call
1. Click the **"Start Call"** button
2. Grant microphone access when prompted
3. Wait for the system to find a partner
4. Once matched, you'll be connected automatically

### During a Call
- **Mute/Unmute**: Toggle your microphone on/off
- **Skip**: Move to a new random partner
- **End Call**: Terminate the current session

### Connection States
- **Disconnected**: Not in a call, ready to connect
- **Waiting**: Searching for a partner
- **Connecting**: Establishing connection with partner
- **Connected**: Active voice chat in progress

## Project Structure

### Backend
```
Call me Backend/
├── main.py              # FastAPI application and WebSocket handlers
├── requirements.txt     # Python dependencies
└── README.md           # Backend documentation
```

### Frontend
```
call_me/
├── app/
│   ├── page.tsx        # Main application component
│   ├── layout.tsx      # Root layout
│   └── globals.css     # Global styles
├── package.json        # Node dependencies
└── tsconfig.json       # TypeScript configuration
```

## WebSocket Message Protocol

### Client → Server
- `find_match`: Request to find a random partner
- `skip`: Skip current partner
- `offer`: WebRTC SDP offer
- `answer`: WebRTC SDP answer
- `ice_candidate`: ICE candidate for NAT traversal

### Server → Client
- `connected`: Connection established
- `waiting`: Added to waiting queue
- `match_found`: Partner found (includes initiator flag)
- `partner_disconnected`: Partner left the call
- `offer` / `answer` / `ice_candidate`: Forwarded signaling messages

## Parallel & Distributed Computing Concepts

This project demonstrates several key concepts:

1. **Concurrent Connections**: Multiple users connected simultaneously
2. **Distributed Nodes**: Each client acts as an independent node
3. **Real-time Coordination**: Central server coordinates peer matching
4. **Peer-to-Peer Communication**: Direct audio streams between clients
5. **Event-driven Architecture**: WebSocket-based messaging
6. **Stateful Session Management**: Tracking active connections and matches

## Future Enhancements

- [ ] User authentication (optional)
- [ ] Chat history and statistics
- [ ] Language/region-based matching
- [ ] Interest-based matching
- [ ] Video chat support
- [ ] Text chat alongside voice
- [ ] Report and moderation system
- [ ] Mobile app (React Native)
- [ ] TURN server for better NAT traversal
- [ ] End-to-end encryption
- [ ] Quality of service metrics

## Security & Privacy

- **No Account Required**: Fully anonymous usage
- **Temporary Sessions**: All data cleared on disconnect
- **No Storage**: Conversations are not recorded
- **Client-side Audio**: Audio streams never touch the server
- **Session IDs**: Random, non-identifying user IDs

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 15+
- Opera 76+

## Troubleshooting

### Microphone Not Working
- Check browser permissions
- Ensure HTTPS or localhost
- Try a different browser

### Cannot Connect to Partner
- Check if backend is running
- Verify WebSocket connection in browser console
- Check firewall settings

### Audio Quality Issues
- Check internet connection
- Close bandwidth-heavy applications
- Try using headphones

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational purposes demonstrating parallel and distributed computing concepts.

## Acknowledgments

- Inspired by OmeTV and similar random chat platforms
- Built with modern web technologies
- Design inspired by minimalist science-themed interfaces

## Support

For issues, questions, or suggestions, please open an issue in the repository.

---

**Note**: This is an educational project. Use responsibly and respectfully.
