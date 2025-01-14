from kafka import KafkaProducer
from dotenv import load_dotenv
import pandas as pd
import time
import json
import os

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), "../.env")
load_dotenv(dotenv_path)

# Kafka Configuration
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC")
KAFKA_SERVER = os.getenv("KAFKA_SERVER")

# Sleep time between messages
sleep_time = os.getenv("SLEEP_TIME")

# Create Kafka producer
producer = KafkaProducer(
    bootstrap_servers=KAFKA_SERVER,
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
)

# CSV File Path
CSV_FILE = "tweet_data.csv"

# Read the CSV file
data = pd.read_csv(CSV_FILE, lineterminator="\n")

# Stream data to Kafka
for index, row in data.iterrows():
    # Convert the row to a dictionary
    message = row.to_dict()
    producer.send(KAFKA_TOPIC, value=message)
    print(f"Sent to Kafka: {message}")
    # Simulate real-time streaming
    time.sleep(int(sleep_time))

producer.close()
