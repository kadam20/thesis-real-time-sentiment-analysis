from fastapi import WebSocket
import asyncio

class WSClientPool:
    def __init__(self):
        self.clients: list[WebSocket] = []
        self.event_queue = asyncio.Queue()

    def add_client(self, socket: WebSocket):
        print("Registering client", socket)
        self.clients.append(socket)

    def remove_client(self, client: WebSocket):
        print("Removing client", client)
        self.clients.remove(client)

    async def emit(self, payload: str):
        await self.event_queue.put(payload)

    async def serve(self):
        while True:
            payload = await self.event_queue.get()
            for client in self.clients:
                try:
                    print("Sending", payload, "to", client)
                    await client.send_json(payload)
                except Exception as e:
                    print(f"Error sending to {client}: {e}")
                    self.remove_client(client)
