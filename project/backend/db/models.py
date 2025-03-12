from sqlalchemy import Column, Integer, String
from backend.db.database import Base
from pydantic import BaseModel


class Tweets(Base):
    __tablename__ = "tweets"

    id = Column(Integer, primary_key=True, index=True)
    tweet_id = Column(String)
    tweet = Column(String)
    likes = Column(Integer)
    retweet_count = Column(Integer)
    user_id = Column(Integer)
    user_name = Column(String)
    user_description = Column(String)
    user_join_date = Column(String)
    user_followers_count = Column(Integer)
    user_location = Column(String)
    city = Column(String)
    country = Column(String)
    continent = Column(String)
    candidate = Column(String)
    state = Column(String)
    state_code = Column(String)
    sentiment_label = Column(String)
    sentiment_score = Column(Integer)
    created_at = Column(String)


class TweetBase(BaseModel):
    tweet: str
    likes: int
    retweet_count: int
    user_name: str
    user_followers_count: int
    state: str
    state_code: str
    candidate: str
    sentiment_label: str
    sentiment_score: float
