# from db_connector import create_connection, insert_into_database
from kafka import KafkaConsumer
from dotenv import load_dotenv
import requests
import json
import os

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), "../.env")
load_dotenv(dotenv_path)

# Kafka configuration
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC")
KAFKA_SERVER = os.getenv("KAFKA_SERVER")

# API configuration
SENTIMENT_API_URL = os.getenv("SENTIMENT_API_URL")

# Create PostgreSQL connection
# connection, cursor = create_connection()

# Create Kafka consumer
consumer = KafkaConsumer(
    KAFKA_TOPIC,
    bootstrap_servers=KAFKA_SERVER,
    auto_offset_reset="earliest",
    value_deserializer=lambda v: json.loads(v.decode("utf-8")),
)

# Consume messages
print("Listening to Kafka topic...")
for message in consumer:
    try:
        # Extract text from Kafka message
        kafka_data = message.value
        text = kafka_data.get("tweet", "")

        if not text:
            print("No text found in Kafka message. Skipping...")
            continue

        # Call Sentiment API
        response = requests.post(SENTIMENT_API_URL, json={"text": text})

        # If API call is successful, push results to the data
        if response.status_code == 200:
            sentiment_data = response.json()
            kafka_data["sentiment_label"] = sentiment_data["sentiment"]["label"]
            kafka_data["sentiment_score"] = sentiment_data["sentiment"]["score"]

            # Insert into PostgreSQL
            # insert_into_database(connection, cursor, kafka_data)
        else:
            print(f"API call failed: {response.status_code}, {response.text}")

    except Exception as e:
        print(f"Error processing Kafka message: {e}")

# Close PostgreSQL connection when done
# cursor.close()
# connection.close()
