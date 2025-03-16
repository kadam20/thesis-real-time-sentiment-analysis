from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import pipeline
import uvicorn

app = FastAPI()

# Initialize the BERT sentiment analysis pipeline
sentiment_analyzer = pipeline("sentiment-analysis")

# Define keywords and hashtags for Trump and Biden
TRUMP_KEYWORDS = ["Trump", "Donald", "#MAGA"]
BIDEN_KEYWORDS = ["Biden", "Joe", "#BuildBackBetter"]

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

@app.get("/")
def home():
    return {"message": "Sentiment Analysis API is running with BERT!"}

@app.post("/analyze")
def analyze_sentiment(request: SentimentRequest):
    try:
        text = request.text
        # Perform sentiment analysis using BERT
        sentiment_result = sentiment_analyzer(text)
        # Prepare the response
        return {
            "text": text,
            "sentiment": {
                "label": sentiment_result[0]["label"],
                "score": sentiment_result[0]["score"],
                "candidate": get_candidate(text),
            },
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)