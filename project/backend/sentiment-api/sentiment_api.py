from flask import Flask, request, jsonify
from transformers import pipeline

app = Flask(__name__)

# Initialize the BERT sentiment analysis pipeline
sentiment_analyzer = pipeline("sentiment-analysis")

# Define keywords and hashtags for Trump and Biden
TRUMP_KEYWORDS = ["Trump", "@realDonaldTrump", "#MAGA", "#Trump2024"]
BIDEN_KEYWORDS = ["Biden", "@JoeBiden", "#Biden", "#Biden2024", "#BuildBackBetter"]

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

       # Determine candidate attribution
        is_trump = any(keyword in text.lower() for keyword in [TRUMP_KEYWORDS])
        is_biden = any(keyword in text.lower() for keyword in [BIDEN_KEYWORDS])

        if is_trump and is_biden:
            candidate = "both"
        elif is_trump:
            candidate = "trump"
        elif is_biden:
            candidate = "biden"
        else:
            candidate = "neutral or unrelated"

        # Prepare the response
        response = {
            "text": text,
            "sentiment": {
                "label": sentiment_result[0]["label"],
                "score": sentiment_result[0]["score"],
                 "candidate": candidate,
            },
        }

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
