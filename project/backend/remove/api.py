from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import backend.db.models as models
from backend.db.database import engine
from backend.api.routes import (
    comparison_route,
    map_route,
    timeline_route,
    sidebar_route,
)
import socketio
import asyncio
# from backend.api.listener import listen_to_postgres
# from contextlib import asynccontextmanager
# import threading
# from fastapi import BackgroundTasks
import os
import asyncpg



# Create an ASGI Socket.IO Server
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
socket_app = socketio.ASGIApp(sio)

# @asynccontextmanager
# async def lifespan(the_app):
#     print("startup")
#     await listen_to_postgres(socket_app)
#     yield
#     print("shutdown")

# Initialize FastAPI
# app = FastAPI(lifespan=lifespan)
app = FastAPI()

# Mount the Socket.IO app inside FastAPI under `/ws`
app.mount("/", socket_app)

# Create tables
models.Base.metadata.create_all(bind=engine)

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
async def root():
    return {"message": "Tweet api works"}

@sio.on("connect")
async def connect(sid, env):
    print("New Client Connected to This id :"+" "+str(sid))

@sio.on("disconnect")
async def disconnect(sid):
    print("Client Disconnected: "+" "+str(sid))


async def main():
    # Start the async Postgres listener
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
        await sio.emit("new_data", "jarjar binks")


    print("VERSIONS")
    print(socketio.__version__)
    asd

    await conn.add_listener("new_data", handle_notify)
    print("asdc")

    await sio.emit("LAJOS", "LAJOS?")

    # Run the FastAPI application
    config = uvicorn.Config(app, host="0.0.0.0", port=8000)
    server = uvicorn.Server(config)
    await server.serve()

if __name__ == "__main__":
    asyncio.run(main())

