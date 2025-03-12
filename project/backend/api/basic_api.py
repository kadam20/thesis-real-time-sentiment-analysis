from flask import Flask, jsonify, request
import asyncio
from backend.db.connection import Database
from flask_cors import CORS

 # Import your database connection module

app = Flask(__name__)
CORS(app)


db = Database()  # Create a singleton instance of Database
db.init_pool()

@app.before_first_request
def initialize():
    """Initialize the database connection pool before handling requests."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(db.init_pool())


@app.route("/tweets", methods=["GET"])
async def get_tweets():
    """Fetch all tweets from the database."""
    try:
        query = "SELECT user_name, tweet, likes, candidate, sentiment_score, retweet_count FROM tweets LIMIT 5;"
        result = await db.fetch(query)
        return jsonify([dict(item) for item in result])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/election-map", methods=["GET"])
async def get_election_map():
    """Fetch all tweets from the database."""
    try:
        query = """SELECT state_code, 
        ROUND(AVG(CASE WHEN candidate LIKE 'biden' OR candidate LIKE 'both' THEN sentiment_score END)::numeric, 2) AS biden_avg_sentiment,
        COUNT(CASE WHEN candidate LIKE 'biden' OR candidate LIKE 'both' THEN sentiment_score END) AS biden_count,
        ROUND(AVG(CASE WHEN candidate LIKE 'trump' OR candidate LIKE 'both' THEN sentiment_score END)::numeric, 2) AS trump_avg_sentiment,
        COUNT(CASE WHEN candidate LIKE 'trump' OR candidate LIKE 'both' THEN sentiment_score END) AS trump_count
        FROM tweets
        GROUP BY state_code;"""

        result = await db.fetch(query)
        return jsonify([dict(item) for item in result])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/timeline-tracker", methods=["GET"])
async def get_timeline_tracker():
    """Fetch all tweets from the database."""
    try:
        query = """SELECT 
    TO_CHAR(created_at, 'YYYY-MM') AS year_month,
	TO_CHAR(created_at, 'Month') AS month_name,
    ROUND(AVG(CASE WHEN candidate LIKE 'biden' OR candidate LIKE 'both' THEN sentiment_score END)::numeric, 5) AS biden_avg_sentiment,
    ROUND(AVG(CASE WHEN candidate LIKE 'trump' OR candidate LIKE 'both' THEN sentiment_score END)::numeric, 5) AS trump_avg_sentiment,
	ROUND(AVG(sentiment_score::numeric), 5) AS total_avg_sentiment
FROM tweets
GROUP BY year_month, month_name
ORDER BY year_month;

"""

        result = await db.fetch(query)
        return jsonify([dict(item) for item in result])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/total-data", methods=["GET"])
async def get_total_data():
    """Fetch all tweets from the database."""
    try:
        query = """SELECT COUNT(id), SUM(likes) AS all_likes, SUM(retweet_count) AS all_retweets,AVG(sentiment_score),  SUM(CASE WHEN sentiment_score < 0 THEN 1 END) AS total_negative, SUM(CASE WHEN sentiment_score >= 0 THEN 1 END) AS total_positive FROM tweets;"""

        result = await db.fetch(query)
        return jsonify([dict(item) for item in result])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/sentiment-data", methods=["GET"])
async def get_sentiment_data():
    """Fetch all tweets from the database."""
    try:
        query = """SELECT AVG(sentiment_score),  SUM(CASE WHEN sentiment_score < 0 THEN 1 END) AS total_negative, SUM(CASE WHEN sentiment_score >= 0 THEN 1 END) AS total_positive FROM tweets;"""

        result = await db.fetch(query)
        return jsonify([dict(item) for item in result])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/sentiment-bins", methods=["GET"])
async def get_sentiment_bins():
    """Fetch all tweets from the database."""
    try:
        query = """SELECT 
	    SUM(CASE WHEN sentiment_score < -0.3 AND (candidate LIKE 'trump' OR candidate like 'both') THEN 1 END) AS total_negative_trump,
	    SUM(CASE WHEN sentiment_score < -0.3 AND (candidate LIKE 'biden' OR candidate like 'both') THEN 1 END) AS total_negative_biden,
	    SUM(CASE WHEN (sentiment_score >= -0.3 OR sentiment_score <= 0.3) AND (candidate LIKE 'trump' OR candidate like 'both') THEN 1 END) AS total_neutral_trump,
	    SUM(CASE WHEN (sentiment_score >= -0.3 OR sentiment_score <= 0.3) AND (candidate LIKE 'biden' OR candidate like 'both') THEN 1 END) AS total_neutral_biden,
	    SUM(CASE WHEN sentiment_score > 0.3 AND (candidate LIKE 'trump' OR candidate like 'both') THEN 1 END) AS total_positive_trump,
	    SUM(CASE WHEN sentiment_score > 0.3 AND (candidate LIKE 'biden' OR candidate like 'both') THEN 1 END) AS total_positive_biden
        FROM tweets;"""

        result = await db.fetch(query)
        return jsonify([dict(item) for item in result])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
