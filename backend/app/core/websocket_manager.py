from fastapi import WebSocket
from typing import Dict, List
import json


class ConnectionManager:
    """
    WebSocket connections manage karne ke liye
    Group-wise connected clients track karta hai
    """

    def __init__(self):
        # {group_id: [(websocket, user_id, user_name)]}
        self.active_connections: Dict[int, List[tuple]] = {}

    async def connect(
        self,
        websocket: WebSocket,
        group_id: int,
        user_id: int,
        user_name: str
    ):
        await websocket.accept()

        if group_id not in self.active_connections:
            self.active_connections[group_id] = []

        self.active_connections[group_id].append(
            (websocket, user_id, user_name)
        )

    def disconnect(self, websocket: WebSocket, group_id: int):
        if group_id in self.active_connections:
            self.active_connections[group_id] = [
                conn for conn in self.active_connections[group_id]
                if conn[0] != websocket
            ]
            # Empty ho gaya to key remove karo
            if not self.active_connections[group_id]:
                del self.active_connections[group_id]

    async def broadcast_to_group(self, group_id: int, message: dict):
        # Group ke sab members ko message bhejo
        if group_id not in self.active_connections:
            return

        disconnected = []
        for websocket, user_id, user_name in self.active_connections[group_id]:
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected.append(websocket)

        # Disconnected wale hata do
        for ws in disconnected:
            self.disconnect(ws, group_id)

    async def send_to_user(
        self,
        group_id: int,
        target_user_id: int,
        message: dict
    ):
        # Specific user ko message bhejo
        if group_id not in self.active_connections:
            return

        for websocket, user_id, user_name in self.active_connections[group_id]:
            if user_id == target_user_id:
                try:
                    await websocket.send_json(message)
                except Exception:
                    pass

    def get_online_users(self, group_id: int) -> List[dict]:
        if group_id not in self.active_connections:
            return []

        return [
            {"user_id": user_id, "user_name": user_name}
            for _, user_id, user_name in self.active_connections[group_id]
        ]

    def get_group_count(self, group_id: int) -> int:
        if group_id not in self.active_connections:
            return 0
        return len(self.active_connections[group_id])


# Global instance — poori app mein ek hi hoga
manager = ConnectionManager()