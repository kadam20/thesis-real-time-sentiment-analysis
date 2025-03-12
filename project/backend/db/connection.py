import asyncpg
import asyncio
import os
from dotenv import load_dotenv
import psycopg2

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), "../.env")
load_dotenv(dotenv_path)

class Database:
    _instance = None  # Singleton instance

    def __new__(cls):
        # Enforce Singleton pattern
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
            cls._instance.pool = None
        return cls._instance

    async def init_pool(self):
        # Initialize the connection pool once
        if self.pool is None:
            self.pool = await asyncpg.create_pool(
                host=os.getenv("DB_HOST"),
                database=os.getenv("DB_NAME"),
                user=os.getenv("DB_USER"),
                password=os.getenv("DB_PASSWORD"),
                port=os.getenv("DB_PORT"),
                min_size=1,
                max_size=5
            )
            print("Database connection pool initialized.")

    async def fetch(self, query, *args):
        # Fetch data from the database
        async with self.pool.acquire() as conn:
            return await conn.fetch(query, *args)

    async def execute(self, query, *args):
        # Execute a query (INSERT, UPDATE, DELETE)
        async with self.pool.acquire() as conn:
            return await conn.execute(query, *args)

    async def close_pool(self):
        # Close the connection pool
        if self.pool:
            await self.pool.close()
            print("Database connection pool closed.")



class SyncDatabase:
    _instance = None  # Singleton instance

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SyncDatabase, cls).__new__(cls)
            cls._instance.connection = None
        return cls._instance

    def init_connection(self):
        # Initialize the database connection
        if self.connection is None:
            self.connection = psycopg2.connect(
                host=os.getenv("DB_HOST"),
                database=os.getenv("DB_NAME"),
                user=os.getenv("DB_USER"),
                password=os.getenv("DB_PASSWORD"),
                port=os.getenv("DB_PORT")
            )
            print("Database connection established.")

    def fetch(self, query, *args):
        # Fetch data from the database
        with self.connection.cursor() as cursor:
            cursor.execute(query, args)
            return cursor.fetchall()

    def execute(self, query, *args):
        # Execute a query (INSERT, UPDATE, DELETE)
        with self.connection.cursor() as cursor:
            cursor.execute(query, args)
            self.connection.commit()

    def close_connection(self):
        # Close the database connection
        if self.connection:
            self.connection.close()
            self.connection = None
            print("Database connection closed.")
