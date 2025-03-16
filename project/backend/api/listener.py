import asyncio
import os
import psycopg2
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), "../.env")
load_dotenv(dotenv_path)

async def listen_to_postgres(sio):
    try:
        conn = psycopg2.connect(
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            host="localhost",
            port=os.getenv("DB_PORT"),
        )
        conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)

        cursor = conn.cursor()
        cursor.execute(f"LISTEN new_data;")
        print("Listening on channel: new_data")

        def handle_notify():
            conn.poll()
            for notify in conn.notifies:
                print(f"Received notification: {notify.payload}")
                asyncio.create_task(sio.emit("new_data", {"message": notify.payload}))
            conn.notifies.clear()

        loop = asyncio.get_event_loop()
        loop.add_reader(conn, handle_notify)
        await asyncio.Event().wait() # keeps the loop running

    except Exception as e:
        print(f"Error listening to Postgres notifications: {e}")
    finally:
        if "conn" in locals() and conn:
            print("Closing connection to the database")
            conn.close()