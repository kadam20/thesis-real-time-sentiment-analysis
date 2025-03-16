from kafka import KafkaProducer
from dotenv import load_dotenv
import pandas as pd
import time
import json
import os

def load_env():
    # Load configuration data from env
    dotenv_path = os.path.join(os.path.dirname(__file__), "../.env")
    load_dotenv(dotenv_path)
    csv_file_path = os.path.join(os.path.dirname(__file__), "tweet_data.csv")
    return {
        "KAFKA_TOPIC": os.getenv("KAFKA_TOPIC"),
        "KAFKA_SERVER": os.getenv("KAFKA_SERVER"),
        "SLEEP_TIME": int(os.getenv("SLEEP_TIME", 1)),
        "CSV_FILE": csv_file_path
    }

def stream_data_to_kafka(producer, config):
    # Read data from CSV
    data = pd.read_csv(config["CSV_FILE"], lineterminator="\n")

    # Go through data to imitate real time data flow
    for _, row in data.iterrows():
        message = row.to_dict()
        producer.send(config["KAFKA_TOPIC"], value=message)
        print('Message: ', message)
        time.sleep(config["SLEEP_TIME"])
    
    # After all data is sent close producer
    producer.close()

def main():
    # Load config 
    config = load_env()
    # Initialize Kafka producer
    producer = KafkaProducer(
        bootstrap_servers=config["KAFKA_SERVER"],
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
    )
    # Start real time data stream
    stream_data_to_kafka(producer, config)

if __name__ == "__main__":
    main()
