import asyncio
import json
import os
from dotenv import load_dotenv
from project.backend.to_be_removed.connection import Database

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), "../.env")
load_dotenv(dotenv_path)


db = Database()
# PostgreSQL Notification Listener
async def listen_to_postgres(socketio):
    await db.init_pool()

    async def notification_handler(connection, pid, channel, payload):
        print(f"Received notification on channel '{channel}': {payload}")
        try:
            data = json.loads(payload)
            # Broadcast the payload to all WebSocket clients
            socketio.emit("new_data", data)
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON payload: {e}")

    async with db.pool.acquire() as conn:
        await conn.add_listener("new_data", notification_handler)
        print("Listening to PostgreSQL channel 'new_data'...")

        while True:
            await asyncio.sleep(1)

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.create_task(listen_to_postgres())
    print(f'LOOP IS RUNNING {loop.is_running}')
    loop.run_forever()
    
    
   
