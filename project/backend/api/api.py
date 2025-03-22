from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from backend.api.ws_client_pool import WSClientPool
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.api.routes import (
    comparison_route,
    map_route,
    timeline_route,
    sidebar_route,
)
import asyncpg
import asyncio
import uvicorn
import dotenv
import os


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

# Include routers
app.include_router(comparison_route.router)
app.include_router(map_route.router)
app.include_router(timeline_route.router)
app.include_router(sidebar_route.router)


@app.get("/")
async def read_root():
    return {"message": "Hello, World!"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    pool.add_client(websocket)

    try:
        while True:
            await websocket.receive_text()
    except (WebSocketDisconnect, RuntimeError):
        pool.remove_client(websocket)


def main():
    uvicorn.run("backend.api.api:app", host="127.0.0.1", port=8000, reload=True)


if __name__ == "__main__":
    main()
