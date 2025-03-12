from fastapi import FastAPI, HTTPException, Depends
from typing import List
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import backend.db.models as models
from backend.db.database import engine, SessionLocal
from sqlalchemy.orm import Session
import socketio

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
    return {"message": "Hello World"}

@app.post("/tweets")
async def create_tweet(tweet: models.TweetBase, db: Session = Depends(get_db)):
    new_tweet = models.Tweets(
        tweet=tweet.tweet,
        likes=tweet.likes,
        retweet_count=tweet.retweet_count,
        user_name=tweet.user_name,
        user_followers_count=tweet.user_followers_count,
        state=tweet.state,
        state_code=tweet.state_code,
        candidate=tweet.candidate,
        sentiment_label=tweet.sentiment_label,
        sentiment_score=tweet.sentiment_score,
    )
    db.add(new_tweet)
    db.commit()
    db.refresh(new_tweet)

    # Emit event to notify clients about new tweets
    await sio.emit("new_tweet", {"tweet": new_tweet.tweet})

    return new_tweet

@app.get("/top-tweets")
async def get_tweets(db: Session = Depends(get_db)):
    result = db.query(models.Tweets).limit(5).all()  # Fixed `.top(5)` to `.limit(5).all()`
    if not result:
        raise HTTPException(status_code=404, detail="No tweets found")
    return result

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
