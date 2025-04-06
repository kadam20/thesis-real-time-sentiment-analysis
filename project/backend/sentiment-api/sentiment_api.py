from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import pipeline
import uvicorn

app = FastAPI()

# Initialize the BERT sentiment analysis pipeline
sentiment_analyzer = pipeline("sentiment-analysis", model="cardiffnlp/twitter-roberta-base-sentiment", return_all_scores=True)

# Define keywords and hashtags for Trump and Biden
TRUMP_KEYWORDS = ["trump", "donald"]
BIDEN_KEYWORDS = ["biden", "joe"]

class SentimentRequest(BaseModel):
    text: str

def get_candidate(text: str):
    # Determine candidate attribution
    is_trump = any(keyword.lower() in text.lower() for keyword in TRUMP_KEYWORDS)
    is_biden = any(keyword.lower() in text.lower() for keyword in BIDEN_KEYWORDS)

    if is_trump and not is_biden:
        return "trump"
    elif is_biden and not is_trump:
        return "biden"
    else:
        return "both"

def get_sentiment(result):
    # Perform sentiment analysis using BERT
    scores = {entry["label"]: entry["score"] for entry in result[0]}
    print('scores:', scores)
    print('scores["LABEL_2"]:', scores["LABEL_2"])
    print('scores["LABEL_0"]:', scores["LABEL_0"])

    sentiment_score = (
        scores["LABEL_2"] -
        scores["LABEL_0"]
    )
    print('sentiment_score: ', sentiment_score)
    return sentiment_score

@app.get("/")
def home():
    return {"message": "Sentiment Analysis API is running with BERT!"}

@app.post("/analyze")
def analyze_sentiment(request: SentimentRequest):
    try:
        text = request.text
        # Perform sentiment analysis using BERT
        sentiment_result = sentiment_analyzer(text)
        scores = {entry["label"]: entry["score"] for entry in sentiment_result[0]}
        sentiment_score = (
               scores["LABEL_2"] -
               scores["LABEL_0"]
           )
        # Prepare the response
        return {
            "text": text,
            "sentiment": {
                "score": sentiment_score,
                "candidate": get_candidate(text),
                "label": "positive" if sentiment_score > 0 else "negative",
            },
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)