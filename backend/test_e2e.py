#!/usr/bin/env python3
"""End-to-end test: Alice and Bob chat via WebSocket."""

import asyncio
import json
import websockets

# Alice's token (from seed data)
ALICE_TOKEN = "MToxNzg2NTQ5ODM1LjYzNjc0OQ=="
# Bob's token
BOB_TOKEN = "MjoxNzg2NTUxOTQ1LjA3OTA2Nw=="

WS_URL = "ws://127.0.0.1:8000/ws"

async def alice_chat():
    """Alice sends messages."""
    print("=== ALICE CONNECTING ===")
    async with websockets.connect(f"{WS_URL}?token={ALICE_TOKEN}") as ws:
        print("Alice connected")
        
        # Send a message
        await ws.send(json.dumps({
            "type": "chat",
            "data": {"conversation_id": 1, "content": "Hello Bob from Alice!"}
        }))
        print("Alice sent message")
        
        # Receive own message echo
        response = await ws.recv()
        print(f"Alice received: {json.loads(response)['data']['content']}")
        
        # Wait for Bob's reply
        response = await ws.recv()
        print(f"Alice received: {json.loads(response)['data']['content']}")

async def bob_chat():
    """Bob sends messages."""
    print("=== BOB CONNECTING ===")
    async with websockets.connect(f"{WS_URL}?token={BOB_TOKEN}") as ws:
        print("Bob connected")
        
        # Receive Alice's message
        response = await ws.recv()
        data = json.loads(response)
        print(f"Bob received: {data['data']['content']}")
        
        # Reply
        await ws.send(json.dumps({
            "type": "chat",
            "data": {"conversation_id": 1, "content": "Hi Alice! Got your message."}
        }))
        print("Bob sent reply")
        
        # Receive own echo
        response = await ws.recv()
        print(f"Bob received echo: {json.loads(response)['data']['content']}")

async def main():
    # Run both clients concurrently
    await asyncio.gather(
        alice_chat(),
        bob_chat(),
    )

if __name__ == "__main__":
    asyncio.run(main())