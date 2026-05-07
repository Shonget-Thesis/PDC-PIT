# Call Me Backend - Anonymous Voice Chat Signaling Server

FastAPI-based WebSocket signaling server for the Call Me anonymous voice chat platform.

## Features

- Real-time WebSocket connections for signaling
- Random user matching algorithm
- Session management without database
- WebRTC signaling (SDP offer/answer, ICE candidates)
- Skip functionality to find new partners
- CORS configured for Next.js frontend

## Installation

1. Install Python 3.8 or higher

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The server will start on `http://localhost:8000`

## API Endpoints

### HTTP
- `GET /` - Server status and statistics

### WebSocket
- `WS /ws/{user_id}` - WebSocket connection for signaling

## WebSocket Message Types

### Client → Server
- `find_match` - Request to find a random partner
- `skip` - Skip current partner and find a new one
- `offer` - WebRTC SDP offer
- `answer` - WebRTC SDP answer
- `ice_candidate` - ICE candidate for connection setup

### Server → Client
- `connected` - Connection established
- `waiting` - Added to waiting queue
- `match_found` - Partner found
- `partner_disconnected` - Current partner left
- `offer` / `answer` / `ice_candidate` - Forwarded signaling messages

## Architecture

The server uses an in-memory connection manager that handles:
- Active WebSocket connections
- Waiting queue for users seeking partners
- Current matches between users
- Message routing between matched pairs

## Development

The server runs without a database, using temporary session identifiers to manage anonymous users. All state is kept in memory and cleared on restart.
