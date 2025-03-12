import asyncio
import os
import asyncpg
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), "../.env")
load_dotenv(dotenv_path)


async def listen_to_postgres(sio):
    # Listens for notifications on the 'new_data' channel
    try:
        connection = await asyncpg.connect(
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            host="localhost",
            port=os.getenv("DB_PORT"),
        )

        async def notification_listener(channel, payload):
            # When a notification is received, emit it to the Socket.IO clients
            print(f"Received notification on channel '{channel}': {payload}")
            await sio.emit("new_data", {"message": payload})

        # Add the listener to the connection
        await connection.add_listener("new_data", notification_listener)
        await connection.execute("LISTEN new_data;")

        # Keep the connection alive to receive notifications
        while True:
            await asyncio.sleep(1)
    except Exception as e:
        print(f"Error listening to Postgres notifications: {e}")
    finally:
        if "connection" in locals() and connection:
            await connection.close()
