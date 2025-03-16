from flask import Flask, jsonify
from flask_socketio import SocketIO
import asyncio
import json
import os
from dotenv import load_dotenv
from backend.remove.connection import Database
from backend.api.listener import listen_to_postgres
import threading
import time
from flask_cors import CORS


# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), "../.env")
load_dotenv(dotenv_path)

# Flask and SocketIO initialization
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

db = Database()
db.init_pool()

_TEST_KEYS = ["user_name", "tweet", "likes", "candidate", "sentiment_score", "retweet_count"]

# WebSocket Event Handlers
@socketio.on("connect")
def on_connect():
    print("Client connected!")


@socketio.on("disconnect")
def on_disconnect():
    print("Client disconnected!")


def run_postgre_listener(socketio):
    asyncio.run(listen_to_postgres(socketio))



@app.route("/tweets", methods=["GET"])
def get_all_tweets():
    return [
        {
            "tweet": "tweet",
            "likes": 1,
            "retweetCount": 1,
            "userName": "userName",
            "candidate": "candidate",
            "sentimentScore": 1,
        },
        {
            "tweet": "tweet",
            "likes": 1,
            "retweetCount": 1,
            "userName": "userName",
            "candidate": "trump",
            "sentimentScore": 1,
        },
    ]


# @app.route("/election-map", methods=["GET"])
# def get_election_map():
#     return [{"year_month": "2020-11", "biden_avg_sentiment": 0.5, "trump_avg_sentiment": 0.5}]


@app.route("/timeline-tracker", methods=["GET"])
def get_timeline_tracker():
    return [
        {
            "year_month": "2020-9",
            "month_name": "September",
            "biden_avg_sentiment": 0.3,
            "trump_avg_sentiment": 0.5,
            "total_avg_sentiment": 0.4,
        },
        {
            "year_month": "2020-10",
            "month_name": "October",
            "biden_avg_sentiment": 0.5,
            "trump_avg_sentiment": 0.7,
            "total_avg_sentiment": 0.6,
        },
        {
            "year_month": "2020-11",
            "month_name": "November",
            "biden_avg_sentiment": 0.1,
            "trump_avg_sentiment": 0.0,
            "total_avg_sentiment": 0.05,
        },
    ]


@app.route("/total-data", methods=["GET"])
def get_total_data():
    return {
        "count": 30000,
        "all_likes": 248043,
        "all_retweets": 50721,
        "avg": 0.3,
        "total_negative": 14962,
        "total_positive": 15038,
        "total_trump": 39420,
        "total_biden": 34929,
    }


@app.route("/sentiment-bins", methods=["GET"])
def get_sentiment_bins():
    return {
        "total_negative_trump": 6894,
        "total_negative_biden": 6900,
        "total_neutral_trump": 20027,
        "total_neutral_biden": 20000,
        "total_positive_trump": 7079,
        "total_positive_biden": 7100,
    }


if __name__ == "__main__":
    # Start the PostgreSQL listener in a background task in a separate thread
    listener_thread = threading.Thread(target=run_postgre_listener, args=(socketio,))
    listener_thread.start()
    socketio.run(app, debug=True)
    listener_thread.join()
