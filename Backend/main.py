from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Set, Optional
import json
import uuid
import asyncio
from datetime import datetime, timedelta
import os
from collections import defaultdict

app = FastAPI(title="SYNCED - Academic Peer Connection Backend")

# CORS configuration - allow frontend origins
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConnectionManager:
    def __init__(self):
        # Active WebSocket connections: {user_id: websocket}
        self.active_connections: Dict[str, WebSocket] = {}
        # Users waiting for a match with their preferences: {user_id: {...}}
        self.waiting_queue: Dict[str, dict] = {}
        # Current matches: {user_id: partner_id}
        self.matches: Dict[str, str] = {}
        # User info for connected users: {user_id: {...}}
        self.user_info: Dict[str, dict] = {}
        # Last message timestamp for rate limiting: {user_id: datetime}
        self.last_message_time: Dict[str, datetime] = {}
        # Connection attempt tracking: {user_id: [(timestamp, success), ...]}
        self.connection_attempts: Dict[str, list] = defaultdict(list)
        # Last heartbeat received: {user_id: datetime}
        self.last_heartbeat: Dict[str, datetime] = {}
        # Rate limiting constants
        self.message_rate_limit = 0.1  # Min 100ms between messages
        self.max_connection_attempts = 10  # Max attempts per minute
        self.connection_attempt_window = 60  # 1 minute window
        
    async def connect(self, user_id: str, websocket: WebSocket):
        """Register a new WebSocket connection"""
        # Check connection attempt limit
        if not self.check_connection_limit(user_id):
            await websocket.accept()
            await websocket.send_json({
                "type": "error",
                "message": "Too many connection attempts. Please wait before trying again.",
                "timestamp": datetime.now().isoformat()
            })
            await websocket.close(code=1008, reason="Rate limit exceeded")
            return
        
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.last_heartbeat[user_id] = datetime.now()  # Initialize heartbeat
        print(f"User {user_id} connected. Total connections: {len(self.active_connections)}")
        
    def disconnect(self, user_id: str):
        """Remove a user from all tracking structures"""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.user_info:
            del self.user_info[user_id]
        if user_id in self.waiting_queue:
            del self.waiting_queue[user_id]
        if user_id in self.last_message_time:
            del self.last_message_time[user_id]
        if user_id in self.last_heartbeat:
            del self.last_heartbeat[user_id]
        if user_id in self.matches:
            partner_id = self.matches[user_id]
            del self.matches[user_id]
            if partner_id in self.matches:
                del self.matches[partner_id]
            return partner_id
        print(f"User {user_id} disconnected. Total connections: {len(self.active_connections)}")
        return None
        
    async def find_match(self, user_id: str, field: str = "", program: str = "", year_level: str = "", interests: list = None, nickname: str = ""):
        """Find a compatible partner for the user based on field, program, year level, and interests"""
        # Input validation and sanitization
        field = str(field).strip()[:100] if field else ""
        program = str(program).strip()[:100] if program else ""
        year_level = str(year_level).strip()[:50] if year_level else ""
        nickname = str(nickname).strip()[:20] if nickname else "Anonymous"
        interests = [str(i).strip()[:50] for i in (interests or [])][:10]  # Max 10 interests
        
        # Remove user from queue if they're already there
        if user_id in self.waiting_queue:
            del self.waiting_queue[user_id]
        
        # Store user info
        self.user_info[user_id] = {
            "nickname": nickname or "Anonymous",
            "field": field,
            "year_level": year_level
        }
        
        interests = interests or []
        best_match = None
        best_score = -1
        
        print(f"Finding match for {user_id}: field={field}, program={program}, year_level={year_level}, interests={interests}")
        print(f"Waiting queue size: {len(self.waiting_queue)}")
        
        # Find compatible users in waiting queue
        for waiting_id, waiting_data in list(self.waiting_queue.items()):
            if waiting_id == user_id or waiting_id in self.matches:
                continue
                
            # Calculate compatibility score
            score = 0
            waiting_field = waiting_data.get("field", "")
            waiting_program = waiting_data.get("program", "")
            waiting_year_level = waiting_data.get("year_level", "")
            waiting_interests = waiting_data.get("interests", [])
            
            print(f"Checking {waiting_id}: field={waiting_field}, program={waiting_program}, year_level={waiting_year_level}, interests={waiting_interests}")
            
            # Score based on field similarity
            if field and waiting_field:
                if field == waiting_field:
                    score += 30
                    print(f"  Field match: {field}")
                else:
                    score += 5
                    print(f"  Different field: {field} vs {waiting_field}")
            
            # Score based on program similarity as higher priority
            if program and waiting_program:
                if program == waiting_program:
                    score += 50
                    print(f"  Program match: {program}")
                else:
                    score += 10
                    print(f"  Different programs: {program} vs {waiting_program}")
            
            # Score based on year level similarity
            if year_level and waiting_year_level:
                if year_level == waiting_year_level:
                    score += 20
                    print(f"  Year level match: {year_level}")
                else:
                    score += 5
                    print(f"  Different year levels: {year_level} vs {waiting_year_level}")
            
            # Add interest overlap as secondary scoring
            if interests and waiting_interests:
                common_interests = set(interests) & set(waiting_interests)
                interest_score = len(common_interests) * 2
                score += interest_score
                print(f"  Common interests: {common_interests}, added {interest_score} points")
            
            # Select best match
            if score > best_score:
                best_match = waiting_id
                best_score = score
                print(f"  New best match! Score: {best_score}")
        
        if best_match and best_score >= 0:
            # Match found
            del self.waiting_queue[best_match]
            
            # Create mutual match
            self.matches[user_id] = best_match
            self.matches[best_match] = user_id
            
            print(f"Matched {user_id} with {best_match} (score: {best_score})")
            return best_match
        else:
            # No match found, add to waiting queue with preferences
            self.waiting_queue[user_id] = {
                "field": field,
                "program": program,
                "year_level": year_level,
                "interests": interests,
                "nickname": nickname or "Anonymous"
            }
            print(f"User {user_id} added to waiting queue. Queue size: {len(self.waiting_queue)}")
            return None
            
    async def send_to_user(self, user_id: str, message: dict):
        """Send a message to a specific user"""
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except Exception as e:
                print(f"Error sending to {user_id}: {e}")
                
    async def notify_partner_disconnected(self, partner_id: str):
        """Notify a user that their partner disconnected"""
        await self.send_to_user(partner_id, {
            "type": "partner_disconnected",
            "timestamp": datetime.now().isoformat()
        })
        # Remove partner from matches
        if partner_id in self.matches:
            del self.matches[partner_id]
            
    async def broadcast_online_count(self):
        """Broadcast the current online user count to all connected users"""
        count = len(self.active_connections)
        message = {
            "type": "online_count",
            "count": count,
            "timestamp": datetime.now().isoformat()
        }
        # Send to all connected users
        for user_id in list(self.active_connections.keys()):
            await self.send_to_user(user_id, message)
            
    def get_online_count(self) -> int:
        """Get the current number of online users"""
        return len(self.active_connections)
    
    def check_rate_limit(self, user_id: str) -> bool:
        """Check if user has exceeded message rate limit"""
        now = datetime.now()
        if user_id in self.last_message_time:
            time_diff = (now - self.last_message_time[user_id]).total_seconds()
            if time_diff < self.message_rate_limit:
                return False  # Rate limit exceeded
        self.last_message_time[user_id] = now
        return True  # Rate limit check passed
    
    def check_connection_limit(self, user_id: str) -> bool:
        """Check if user has exceeded connection attempt limit"""
        now = datetime.now()
        # Clean old attempts outside the window
        self.connection_attempts[user_id] = [
            (ts, success) for ts, success in self.connection_attempts[user_id]
            if (now - ts).total_seconds() < self.connection_attempt_window
        ]
        # Check if exceeded max attempts
        if len(self.connection_attempts[user_id]) >= self.max_connection_attempts:
            return False
        self.connection_attempts[user_id].append((now, True))
        return True
    
    def record_heartbeat(self, user_id: str):
        """Record heartbeat timestamp for connection health monitoring"""
        self.last_heartbeat[user_id] = datetime.now()
    
    def is_connection_healthy(self, user_id: str, timeout_seconds: int = 90) -> bool:
        """Check if connection is still healthy based on heartbeat"""
        if user_id not in self.last_heartbeat:
            return True  # No heartbeat yet, assume healthy
        time_since_heartbeat = (datetime.now() - self.last_heartbeat[user_id]).total_seconds()
        return time_since_heartbeat < timeout_seconds


manager = ConnectionManager()


@app.get("/")
async def root():
    return {
        "app": "SYNCED - Academic Peer Connection Backend",
        "status": "running",
        "active_connections": len(manager.active_connections),
        "waiting_queue": len(manager.waiting_queue),
        "active_matches": len(manager.matches) // 2
    }


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time signaling"""
    await manager.connect(user_id, websocket)
    
    try:
        # Send connection confirmation
        await websocket.send_json({
            "type": "connected",
            "user_id": user_id,
            "timestamp": datetime.now().isoformat()
        })
        
        # Send initial online count
        await websocket.send_json({
            "type": "online_count",
            "count": manager.get_online_count(),
            "timestamp": datetime.now().isoformat()
        })
        
        # Broadcast updated count to all users
        await manager.broadcast_online_count()
        
        # Main message loop
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            message_type = message.get("type")
            
            print(f"Received from {user_id}: {message_type}")
            
            # Check rate limit for all messages except heartbeat
            if message_type != "heartbeat" and not manager.check_rate_limit(user_id):
                await manager.send_to_user(user_id, {
                    "type": "error",
                    "message": "Message rate limit exceeded. Please slow down.",
                    "timestamp": datetime.now().isoformat()
                })
                continue
            
            if message_type == "heartbeat":
                # Record heartbeat and send acknowledgment
                manager.record_heartbeat(user_id)
                await manager.send_to_user(user_id, {
                    "type": "heartbeat",
                    "timestamp": datetime.now().isoformat()
                })
                continue
            
            if message_type == "find_match":
                # User wants to find a new partner
                field = message.get("field", "")
                program = message.get("program", "")
                year_level = message.get("year_level", "")
                interests = message.get("interests", [])
                nickname = message.get("nickname", "Anonymous")
                
                partner_id = await manager.find_match(user_id, field, program, year_level, interests, nickname)
                
                if partner_id:
                    # Match found - notify both users
                    partner_info = manager.user_info.get(partner_id, {"nickname": "Anonymous", "field": "", "year_level": ""})
                    user_info = manager.user_info.get(user_id, {"nickname": "Anonymous", "field": "", "year_level": ""})
                    
                    await manager.send_to_user(user_id, {
                        "type": "match_found",
                        "partner_id": partner_id,
                        "is_initiator": True,
                        "timestamp": datetime.now().isoformat()
                    })
                    # Send partner's info to user
                    await manager.send_to_user(user_id, {
                        "type": "user_info",
                        "nickname": partner_info["nickname"],
                        "field": partner_info["field"],
                        "year_level": partner_info["year_level"],
                        "timestamp": datetime.now().isoformat()
                    })
                    
                    await manager.send_to_user(partner_id, {
                        "type": "match_found",
                        "partner_id": user_id,
                        "is_initiator": False,
                        "timestamp": datetime.now().isoformat()
                    })
                    # Send user's info to partner
                    await manager.send_to_user(partner_id, {
                        "type": "user_info",
                        "nickname": user_info["nickname"],
                        "field": user_info["field"],
                        "year_level": user_info["year_level"],
                        "timestamp": datetime.now().isoformat()
                    })
                else:
                    # No match yet - user added to queue
                    await manager.send_to_user(user_id, {
                        "type": "waiting",
                        "message": "Looking for a partner...",
                        "timestamp": datetime.now().isoformat()
                    })
                    
            elif message_type == "skip":
                # User wants to skip current partner
                if user_id in manager.matches:
                    partner_id = manager.matches[user_id]
                    
                    # Notify partner
                    await manager.notify_partner_disconnected(partner_id)
                    
                    # Remove match
                    del manager.matches[user_id]
                    if partner_id in manager.matches:
                        del manager.matches[partner_id]
                    
                    # Find new match with same preferences
                    field = message.get("field", "")
                    program = message.get("program", "")
                    year_level = message.get("year_level", "")
                    interests = message.get("interests", [])
                    nickname = message.get("nickname", "Anonymous")
                    new_partner = await manager.find_match(user_id, field, program, year_level, interests, nickname)
                    if new_partner:
                        new_partner_info = manager.user_info.get(new_partner, {"nickname": "Anonymous", "field": "", "year_level": ""})
                        user_info = manager.user_info.get(user_id, {"nickname": "Anonymous", "field": "", "year_level": ""})
                        
                        await manager.send_to_user(user_id, {
                            "type": "match_found",
                            "partner_id": new_partner,
                            "is_initiator": True,
                            "timestamp": datetime.now().isoformat()
                        })
                        # Send new partner's info to user
                        await manager.send_to_user(user_id, {
                            "type": "user_info",
                            "nickname": new_partner_info["nickname"],
                            "field": new_partner_info["field"],
                            "year_level": new_partner_info["year_level"],
                            "timestamp": datetime.now().isoformat()
                        })
                        
                        await manager.send_to_user(new_partner, {
                            "type": "match_found",
                            "partner_id": user_id,
                            "is_initiator": False,
                            "timestamp": datetime.now().isoformat()
                        })
                        # Send user's info to new partner
                        await manager.send_to_user(new_partner, {
                            "type": "user_info",
                            "nickname": user_info["nickname"],
                            "field": user_info["field"],
                            "year_level": user_info["year_level"],
                            "timestamp": datetime.now().isoformat()
                        })
                    else:
                        await manager.send_to_user(user_id, {
                            "type": "waiting",
                            "message": "Looking for a new partner...",
                            "timestamp": datetime.now().isoformat()
                        })
                        
            elif message_type in ["offer", "answer", "ice_candidate"]:
                # WebRTC signaling messages - forward to partner
                if user_id in manager.matches:
                    partner_id = manager.matches[user_id]
                    await manager.send_to_user(partner_id, {
                        "type": message_type,
                        "from": user_id,
                        "data": message.get("data"),
                        "timestamp": datetime.now().isoformat()
                    })
                    
            elif message_type == "chat_message":
                # Chat message - forward to partner
                if user_id in manager.matches:
                    partner_id = manager.matches[user_id]
                    await manager.send_to_user(partner_id, {
                        "type": "chat_message",
                        "from": user_id,
                        "message": message.get("message"),
                        "timestamp": datetime.now().isoformat()
                    })
                    
    except WebSocketDisconnect:
        print(f"User {user_id} disconnected")
        partner_id = manager.disconnect(user_id)
        if partner_id:
            await manager.notify_partner_disconnected(partner_id)
        # Broadcast updated online count
        await manager.broadcast_online_count()
    except Exception as e:
        print(f"Error in WebSocket for {user_id}: {e}")
        partner_id = manager.disconnect(user_id)
        if partner_id:
            await manager.notify_partner_disconnected(partner_id)
        # Broadcast updated online count
        await manager.broadcast_online_count()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
