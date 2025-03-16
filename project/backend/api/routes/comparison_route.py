from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.db.database import get_db
import backend.db.models as models
from fastapi.responses import JSONResponse
from sqlalchemy.sql import func, case

router = APIRouter()

@router.get("/sentiment-bins")
async def sentiment_bins(db: Session = Depends(get_db)):
    # Fetch aggregated tweet sentiment bins
    try:
        result = db.query(
            func.sum(case((models.Tweets.sentiment_score < -0.3, 1), else_=0))
            .filter(models.Tweets.candidate.in_(["trump", "both"]))
            .label("total_negative_trump"),
            func.sum(case((models.Tweets.sentiment_score < -0.3, 1), else_=0))
            .filter(models.Tweets.candidate.in_(["biden", "both"]))
            .label("total_negative_biden"),
            func.sum(
                case((models.Tweets.sentiment_score.between(-0.3, 0.3), 1), else_=0)
            )
            .filter(models.Tweets.candidate.in_(["trump", "both"]))
            .label("total_neutral_trump"),
            func.sum(
                case((models.Tweets.sentiment_score.between(-0.3, 0.3), 1), else_=0)
            )
            .filter(models.Tweets.candidate.in_(["biden", "both"]))
            .label("total_neutral_biden"),
            func.sum(case((models.Tweets.sentiment_score > 0.3, 1), else_=0))
            .filter(models.Tweets.candidate.in_(["trump", "both"]))
            .label("total_positive_trump"),
            func.sum(case((models.Tweets.sentiment_score > 0.3, 1), else_=0))
            .filter(models.Tweets.candidate.in_(["biden", "both"]))
            .label("total_positive_biden"),
        ).first()

        # Create a dictionary to store the sentiment bins
        sentiment_bins = {
            "total_negative_trump": result.total_negative_trump,
            "total_negative_biden": result.total_negative_biden,
            "total_neutral_trump": result.total_neutral_trump,
            "total_neutral_biden": result.total_neutral_biden,
            "total_positive_trump": result.total_positive_trump,
            "total_positive_biden": result.total_positive_biden,
        }

        return JSONResponse(content=sentiment_bins)

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@router.get("/tweet-stats")
async def get_tweet_stats(db: Session = Depends(get_db)):
    # Fetch aggregated tweet statistics including count, likes, retweets, and sentiment analysis
    try:
        result = db.query(
            func.count(models.Tweets.id).label("total_tweets"),
            func.sum(models.Tweets.likes).label("all_likes"),
            func.sum(models.Tweets.retweet_count).label("all_retweets"),
            func.avg(models.Tweets.sentiment_score).label("avg_sentiment"),
            func.sum(case((models.Tweets.sentiment_score < 0, 1), else_=0)).label(
                "total_negative"
            ),
            func.sum(case((models.Tweets.sentiment_score >= 0, 1), else_=0)).label(
                "total_positive"
            ),
            func.sum(case((models.Tweets.candidate != 'biden', 1), else_=0)).label(
                "total_trump"
            ),
            func.sum(case((models.Tweets.candidate != 'trump', 1), else_=0)).label(
                "total_biden"
            ),
        ).first()

        # Create a dictionary to store the tweet statistics
        tweet_stats = {
            "total_tweets": result.total_tweets,
            "all_likes": result.all_likes,
            "all_retweets": result.all_retweets,
            "avg_sentiment": (
                round(result.avg_sentiment, 2)
                if result.avg_sentiment is not None
                else None
            ),
            "total_negative": result.total_negative,
            "total_positive": result.total_positive,
            "total_trump": result.total_trump,
            "total_biden": result.total_biden,
        }

        return JSONResponse(content=tweet_stats)

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
