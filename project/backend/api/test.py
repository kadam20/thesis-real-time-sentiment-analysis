from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import os
import asyncpg
import dotenv
import asyncio
from contextlib import asynccontextmanager
import uvicorn
from fastapi.responses import HTMLResponse


dotenv.load_dotenv()

pool = None
conn = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global conn, pool
    pool = WSClientPool()

    conn = await asyncpg.connect(
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        host="localhost",
        port=os.getenv("DB_PORT"),
    )

    print("Listening on channel: new_data")

    async def handle_notify(connection, pid, channel, payload):
        print(f"Received notification: {payload}")
        await pool.emit(payload)

    await conn.add_listener("new_data", handle_notify)
    print("Registered pg listener")

    # Start the pool's serving loop
    asyncio.create_task(pool.serve())
    print("Scheduled pool.serve")

    yield

    # Clean up on shutdown
    await conn.close()
    print("Database connection closed")

app = FastAPI(lifespan=lifespan)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def read_root():
    return {"message": "Hello, World!"}


html = """
<!DOCTYPE html>
<html>
    <head>
        <title>Chat</title>
    </head>
    <body>
        <h1>WebSocket Chat</h1>
        <form action="" onsubmit="sendMessage(event)">
            <input type="text" id="messageText" autocomplete="off"/>
            <button>Send</button>
        </form>
        <ul id='messages'>
        </ul>
        <script>
            var ws = new WebSocket("ws://localhost:8000/ws");
            ws.onmessage = function(event) {
                console.log("GOT MESSAGE")
                console.log(event)
                var messages = document.getElementById('messages')
                var message = document.createElement('li')
                var content = document.createTextNode(event.data)
                message.appendChild(content)
                messages.appendChild(message)
            };
            function sendMessage(event) {
                var input = document.getElementById("messageText")
                ws.send(input.value)
                input.value = ''
                event.preventDefault()
            }
        </script>
    </body>
</html>
"""


@app.get("/test")
async def get():
    return HTMLResponse(html)

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
        print("SERVING...")
        while True:
            payload = await self.event_queue.get()
            for client in self.clients:
                try:
                    print("Sending", payload, "to", client)
                    await client.send_text("Payload: " + payload)
                except Exception as e:
                    print(f"Error sending to {client}: {e}")
                    self.remove_client(client)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    pool.add_client(websocket)

    try:
        while True:
            await websocket.receive_text()  # Keep the connection alive
    except (WebSocketDisconnect, RuntimeError):
        pool.remove_client(websocket)

def main():
    uvicorn.run("backend.api.test:app", host="127.0.0.1", port=8000, reload=True)

if __name__ == "__main__":
    main()
