import asyncio
import os
import asyncpg
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), "../.env")
load_dotenv(dotenv_path)

async def listen_to_postgres(callback):
    try:
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

            asyncio.create_task(callback(payload))


        await conn.add_listener("new_data", handle_notify)

        # Keep the connection alive
        while True:
            await asyncio.sleep(1)

    except Exception as e:
        print(f"Error listening to Postgres notifications: {e}")
    finally:
        if conn:
            print("Closing connection to the database")
            await conn.close()
