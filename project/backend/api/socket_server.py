import socketio

# Create an ASGI Socket.IO Server
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
socket_app = socketio.ASGIApp(sio)

@sio.event
async def connect(sid, environ):
    print(f"Client {sid} connected")

@sio.event
async def disconnect(sid):
    print(f"Client {sid} disconnected")

@sio.event
async def send_message(data):
    print(f"Message from socket: {data}")
    await sio.emit("new_data", {"data": data})