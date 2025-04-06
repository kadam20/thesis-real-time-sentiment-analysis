from kafka import KafkaConsumer
from dotenv import load_dotenv
import requests
import json
import os
import backend.db.models as models
from backend.db.database import engine
from backend.db.database import get_db
from datetime import datetime

def load_env():
    # Load configuration data from env
    dotenv_path = os.path.join(os.path.dirname(__file__), "../.env")
    load_dotenv(dotenv_path)
    return {
        "KAFKA_TOPIC": os.getenv("KAFKA_TOPIC"),
        "KAFKA_SERVER": os.getenv("KAFKA_SERVER"),
        "SENTIMENT_API_URL": os.getenv("SENTIMENT_API_URL")
    }

def process_message(message, config, db):
    try:
        # Extract tweet from message
        kafka_data = message.value
        text = kafka_data.get("tweet", "")

        # Skip message when there is no tweet
        if not text:
            print("No text found in Kafka message. Skipping...")
            return None

        # Sending text for sentiment analysis
        response = requests.post(config["SENTIMENT_API_URL"], json={"text": text})

        # If analysis was successful, extend message with the new values
        if response.status_code == 200:
            sentiment_data = response.json()
            print("SENTIEMNT RESPONSE", sentiment_data)
            # kafka_data["sentiment_label"] = sentiment_data["sentiment"]["label"]
            # kafka_data["sentiment_score"] = sentiment_data["sentiment"]["score"]

            tweet_entry = models.Tweets(
               tweet_id=kafka_data.get("tweet_id", ""),
               tweet=text,
               likes=kafka_data.get("likes", 0),
               retweet_count=kafka_data.get("retweet_count", 0),
               user_id=kafka_data.get("user_id", 0),
               user_name=kafka_data.get("user_name", ""),
               user_description=kafka_data.get("user_description", ""),
               user_join_date=kafka_data.get("user_join_date", ""),
               user_followers_count=kafka_data.get("user_followers_count", 0),
               user_location=kafka_data.get("user_location", ""),
               city=kafka_data.get("city", ""),
               country=kafka_data.get("country", ""),
               continent=kafka_data.get("continent", ""),
               candidate=sentiment_data["sentiment"]["candidate"],
               state=kafka_data.get("state", ""),
               state_code=kafka_data.get("state_code", ""),
               sentiment_label= sentiment_data["sentiment"]["label"],
               sentiment_score=sentiment_data["sentiment"]["score"],
               created_at= datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            )
            db.add(tweet_entry)
            db.commit()

            return kafka_data
        else:
            print(f"API call failed: {response.status_code}, {response.text}")
    except Exception as e:
        print(f"Error processing Kafka message: {e}")
    return None

def consume_messages(consumer, config):
    db = next(get_db())
    # Sending data to sentiment api for analysis
    print("Listening to Kafka topic...")
    for message in consumer:
        process_message(message, config, db)

if __name__ == "__main__":
    # Load config 
    config = load_env()
    # Initialize Kafka producer
    consumer = KafkaConsumer(
        config["KAFKA_TOPIC"],
        bootstrap_servers=config["KAFKA_SERVER"],
        auto_offset_reset="latest",
        value_deserializer=lambda v: json.loads(v.decode("utf-8")),
    )
    # Process data from producer
    consume_messages(consumer, config)
