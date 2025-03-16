from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import backend.db.models as models
from backend.db.database import engine
from backend.api.socket_server import socket_app
from backend.api.routes import (
    comparison_route,
    map_route,
    timeline_route,
    sidebar_route,
)
import socketio
import asyncio
from backend.api.listener import listen_to_postgres
from contextlib import asynccontextmanager
import threading


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
app.mount("/ws", socket_app)

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

async def main():
    # Start the async Postgres listener
    asyncio.create_task(listen_to_postgres(sio))

    # Run the FastAPI application
    config = uvicorn.Config(app, host="0.0.0.0", port=8000)
    server = uvicorn.Server(config)
    await server.serve()

if __name__ == "__main__":
    asyncio.run(main())

