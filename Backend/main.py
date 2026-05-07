from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Set, Optional
import json
import uuid
import asyncio
from datetime import datetime
import os

app = FastAPI(title="Spark - Anonymous Voice Chat Backend")

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
        # Users waiting for a match with their preferences: {user_id: {"interests": [...], "gender_pref": "..."}}
        self.waiting_queue: Dict[str, dict] = {}
        # Current matches: {user_id: partner_id}
        self.matches: Dict[str, str] = {}
        
    async def connect(self, user_id: str, websocket: WebSocket):
        """Register a new WebSocket connection"""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"User {user_id} connected. Total connections: {len(self.active_connections)}")
        
    def disconnect(self, user_id: str):
        """Remove a user from all tracking structures"""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.waiting_queue:
            del self.waiting_queue[user_id]
        if user_id in self.matches:
            partner_id = self.matches[user_id]
            del self.matches[user_id]
            if partner_id in self.matches:
                del self.matches[partner_id]
            return partner_id
        print(f"User {user_id} disconnected. Total connections: {len(self.active_connections)}")
        return None
        
    async def find_match(self, user_id: str, interests: list = None, gender_pref: str = "any", user_gender: str = ""):
        """Find a compatible partner for the user based on interests and gender preference"""
        # Remove user from queue if they're already there
        if user_id in self.waiting_queue:
            del self.waiting_queue[user_id]
        
        interests = interests or []
        best_match = None
        best_score = 0
        
        print(f"Finding match for {user_id}: interests={interests}, gender_pref={gender_pref}, user_gender={user_gender}")
        print(f"Waiting queue size: {len(self.waiting_queue)}")
        
        # Find compatible users in waiting queue
        for waiting_id, waiting_data in list(self.waiting_queue.items()):
            if waiting_id == user_id or waiting_id in self.matches:
                continue
                
            # Calculate compatibility score
            score = 0
            waiting_interests = waiting_data.get("interests", [])
            waiting_gender_pref = waiting_data.get("gender_pref", "any")
            waiting_user_gender = waiting_data.get("user_gender", "")
            
            print(f"Checking {waiting_id}: interests={waiting_interests}, gender_pref={waiting_gender_pref}, user_gender={waiting_user_gender}")
            
            # Check if gender preferences are compatible
            # User A wants to match with gender_pref, so check if User B's gender matches
            # User B wants to match with their gender_pref, so check if User A's gender matches
            gender_compatible = True
            
            # Check if this user's preference matches the waiting user's gender
            if gender_pref != "any" and waiting_user_gender:
                if gender_pref != waiting_user_gender:
                    gender_compatible = False
                    print(f"  Gender incompatible: {user_id} wants {gender_pref} but {waiting_id} is {waiting_user_gender}")
            
            # Check if waiting user's preference matches this user's gender
            if waiting_gender_pref != "any" and user_gender:
                if waiting_gender_pref != user_gender:
                    gender_compatible = False
                    print(f"  Gender incompatible: {waiting_id} wants {waiting_gender_pref} but {user_id} is {user_gender}")
            
            if not gender_compatible:
                continue  # Skip if gender preferences are incompatible
            
            print(f"  Gender compatible!")
            
            # Calculate interest overlap
            if interests and waiting_interests:
                common_interests = set(interests) & set(waiting_interests)
                score = len(common_interests)
                print(f"  Common interests: {common_interests}, score: {score}")
            
            # Prioritize matches with common interests
            if score > best_score or (score == 0 and best_match is None):
                best_match = waiting_id
                best_score = score
                print(f"  New best match! Score: {best_score}")
        
        if best_match:
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
                "interests": interests,
                "gender_pref": gender_pref,
                "user_gender": user_gender
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


manager = ConnectionManager()


@app.get("/")
async def root():
    return {
        "app": "Spark - Anonymous Voice Chat",
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
            
            if message_type == "find_match":
                # User wants to find a new partner
                interests = message.get("interests", [])
                gender_pref = message.get("gender_pref", "any")
                user_gender = message.get("user_gender", "")
                
                partner_id = await manager.find_match(user_id, interests, gender_pref, user_gender)
                
                if partner_id:
                    # Match found - notify both users
                    await manager.send_to_user(user_id, {
                        "type": "match_found",
                        "partner_id": partner_id,
                        "is_initiator": True,
                        "timestamp": datetime.now().isoformat()
                    })
                    await manager.send_to_user(partner_id, {
                        "type": "match_found",
                        "partner_id": user_id,
                        "is_initiator": False,
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
                    interests = message.get("interests", [])
                    gender_pref = message.get("gender_pref", "any")
                    user_gender = message.get("user_gender", "")
                    new_partner = await manager.find_match(user_id, interests, gender_pref, user_gender)
                    if new_partner:
                        await manager.send_to_user(user_id, {
                            "type": "match_found",
                            "partner_id": new_partner,
                            "is_initiator": True,
                            "timestamp": datetime.now().isoformat()
                        })
                        await manager.send_to_user(new_partner, {
                            "type": "match_found",
                            "partner_id": user_id,
                            "is_initiator": False,
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
