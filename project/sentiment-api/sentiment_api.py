from flask import Flask, request, jsonify
from transformers import pipeline

app = Flask(__name__)

# Initialize the BERT sentiment analysis pipeline
sentiment_analyzer = pipeline("sentiment-analysis")


@app.route("/")
def home():
    return "Sentiment Analysis API is running with BERT!"


@app.route("/analyze", methods=["POST"])
def analyze_sentiment():
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be in JSON format."}), 400
        # Get the input data from the request
        data = request.get_json()

        if not data or "text" not in data:
            return (
                jsonify({"error": "Please provide text for sentiment analysis."}),
                400,
            )

        text = data["text"]

        # Perform sentiment analysis using BERT
        sentiment_result = sentiment_analyzer(text)

        # Prepare the response
        response = {
            "text": text,
            "sentiment": {
                "label": sentiment_result[0]["label"],
                "score": sentiment_result[0]["score"],
            },
        }

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
