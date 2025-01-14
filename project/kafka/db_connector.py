from psycopg2 import OperationalError
from dotenv import load_dotenv
import psycopg2
import os

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), "../.env")
load_dotenv(dotenv_path)

# PostgreSQL Configuration
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_PORT = os.getenv("DB_PORT")

# Function to create PostgreSQL connection
def create_connection():
    try:
        connection = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT,
        )
        cursor = connection.cursor()
        print("Connected to PostgreSQL database.")
        return connection, cursor
    except OperationalError as e:
        print(f"Error connecting to PostgreSQL: {e}")
        raise


# Function to insert data into PostgreSQL
def insert_into_database(connection, cursor, data):
    try:
        insert_query = """
            INSERT INTO sentiment_analysis_results (...)
            VALUES (%s, %s, %s);
        """
        cursor.execute(insert_query, (data))
        connection.commit()
        print(f"Record inserted into DB with ID: {data['tweet_id']}")
    except Exception as e:
        print(f"Error inserting into database: {e}")
        connection.rollback()
