#!/usr/bin/env python3
"""Test WebSocket functionality."""

import asyncio
import json
import websockets

TOKEN = "MToxNzg2NTQ5ODM1LjYzNjc0OQ=="
WS_URL = f"ws://127.0.0.1:8000/ws?token={TOKEN}"

async def test_websocket():
    print("Connecting to WebSocket...")
    async with websockets.connect(WS_URL) as ws:
        print("Connected!\n")
        
        await ws.send(json.dumps({
            "type": "chat",
            "data": {
                "conversation_id": 1,
                "content": "Hello from WebSocket test!"
            }
        }))
        print("Sent chat message")
        
        response = await ws.recv()
        print(f"Received: {response}\n")
        
        await ws.send(json.dumps({
            "type": "typing",
            "data": {
                "conversation_id": 1,
                "is_typing": True
            }
        }))
        print("Sent typing indicator")
        
        await ws.send(json.dumps({
            "type": "view_conversation",
            "data": {
                "conversation_id": 1,
                "is_viewing": True
            }
        }))
        print("Set viewing conversation 1\n")
        
        print("Test complete!")

if __name__ == "__main__":
    asyncio.run(test_websocket())
