from fastapi import FastAPI, HTTPException, Depends
from typing import List
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import backend.db.models as models
from backend.db.database import engine, SessionLocal
from sqlalchemy.orm import Session
import socketio
from sqlalchemy.sql import func, case
from fastapi.responses import JSONResponse
from sqlalchemy import cast, Numeric
import json


# Create an ASGI Socket.IO Server
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
socket_app = socketio.ASGIApp(sio)

# Initialize FastAPI
app = FastAPI()

# Mount the Socket.IO app inside FastAPI under `/ws`
app.mount("/ws", socket_app)

# Create tables
models.Base.metadata.create_all(bind=engine)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
async def root():
    return {"message": "Tweet api works"}


@app.get("/top-tweets")
async def get_tweets(db: Session = Depends(get_db)):
    # Fetches the top 5 tweets
    result = db.query(models.Tweets).limit(5).all()
    if not result:
        raise HTTPException(status_code=404, detail="No tweets found")
    return result


@app.get("/sentiment-bins")
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


@app.get("/tweet-stats")
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
        }

        return JSONResponse(content=tweet_stats)

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/timeline-tracker")
async def get_timeline_tracker(db: Session = Depends(get_db)):
    # Fetch aggregated timeline sentiment data
    try:
        results = (
            db.query(
                func.to_char(models.Tweets.created_at, "YYYY-MM").label("year_month"),
                func.to_char(models.Tweets.created_at, "Month").label("month_name"),
                func.round(
                    cast(
                        func.avg(
                            case(
                                (
                                    models.Tweets.candidate.in_(["biden", "both"]),
                                    models.Tweets.sentiment_score,
                                )
                            )
                        ),
                        Numeric,
                    ),
                    5,
                ).label("biden_avg_sentiment"),
                func.round(
                    cast(
                        func.avg(
                            case(
                                (
                                    models.Tweets.candidate.in_(["trump", "both"]),
                                    models.Tweets.sentiment_score,
                                )
                            )
                        ),
                        Numeric,
                    ),
                    5,
                ).label("trump_avg_sentiment"),
                func.round(
                    cast(func.avg(models.Tweets.sentiment_score), Numeric), 5
                ).label("total_avg_sentiment"),
            )
            .group_by("year_month", "month_name")
            .order_by("year_month")
            .all()
        )

        # Create a list of dictionaries to store the timeline sentiment data
        timeline_tracker = [
            {
                "year_month": row[0],
                "month_name": row[1],
                "biden_avg_sentiment": float(row[2]) if row[2] is not None else None,
                "trump_avg_sentiment": float(row[3]) if row[3] is not None else None,
                "total_avg_sentiment": float(row[4]) if row[4] is not None else None,
            }
            for row in results
        ]

        return JSONResponse(content=json.loads(json.dumps(timeline_tracker)))

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/election-map")
async def get_election_map(db: Session = Depends(get_db)):
    # Fetch aggregated election sentiment data by state
    try:
        results = (
            db.query(
                models.Tweets.state_code,
                func.round(
                    cast(
                        func.avg(
                            case(
                                (
                                    models.Tweets.candidate.in_(["biden", "both"]),
                                    models.Tweets.sentiment_score,
                                )
                            )
                        ),
                        Numeric,
                    ),
                    2,
                ).label("biden_avg_sentiment"),
                func.count(
                    case(
                        (
                            models.Tweets.candidate.in_(["biden", "both"]),
                            models.Tweets.sentiment_score,
                        )
                    )
                ).label("biden_count"),
                func.round(
                    cast(
                        func.avg(
                            case(
                                (
                                    models.Tweets.candidate.in_(["trump", "both"]),
                                    models.Tweets.sentiment_score,
                                )
                            )
                        ),
                        Numeric,
                    ),
                    2,
                ).label("trump_avg_sentiment"),
                func.count(
                    case(
                        (
                            models.Tweets.candidate.in_(["trump", "both"]),
                            models.Tweets.sentiment_score,
                        )
                    )
                ).label("trump_count"),
            )
            .group_by(models.Tweets.state_code)
            .all()
        )

        # Create a list of dictionaries to store the election sentiment data
        election_map = [
            {
                "state_code": row[0],
                "biden_avg_sentiment": float(row[1]) if row[1] is not None else None,
                "biden_count": row[2],
                "trump_avg_sentiment": float(row[3]) if row[3] is not None else None,
                "trump_count": row[4],
            }
            for row in results
        ]

        return JSONResponse(content=json.loads(json.dumps(election_map)))

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


# WebSocket Events
@sio.event
async def connect(sid, environ):
    print(f"Client {sid} connected")
    await sio.emit("message", {"data": "Welcome to the Tweet Stream!"}, room=sid)


@sio.event
async def disconnect(sid):
    print(f"Client {sid} disconnected")


@sio.event
async def send_message(sid, data):
    print(f"Message from {sid}: {data}")
    await sio.emit("message", {"data": data}, skip_sid=sid)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
