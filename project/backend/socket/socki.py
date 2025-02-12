from flask import Flask
from flask_socketio import SocketIO
import asyncio
import json
import os
from dotenv import load_dotenv
from backend.db.connection import Database
from backend.socket.listener import listen_to_postgres
import threading
import time

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), "../.env")
load_dotenv(dotenv_path)

# Flask and SocketIO initialization
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

db = Database()

@app.route("/")
def home():
    return "WebSocket Server for Real-Time Sentiment Data with PostgreSQL Trigger"

# WebSocket Event Handlers
@socketio.on("connect")
def on_connect():
    print("Client connected!")

@socketio.on("disconnect")
def on_disconnect():
    print("Client disconnected!")

@socketio.on('new_data')
def handle_new_data(data):
    print(f"===SUCCESS===: {data}")

@socketio.on('message')
def handle_new_data(data):
    print(f"===CLIENT EMITTED===: {data}")

def run_postgre_listener(socketio):
    asyncio.run(listen_to_postgres(socketio))
    

if __name__ == "__main__":
    # Start the PostgreSQL listener in a background task in a separate thread
    listener_thread = threading.Thread(target=run_postgre_listener, args=(socketio,))
    listener_thread.start()
    socketio.run(app, debug=True)
    listener_thread.join()
    
    
   
