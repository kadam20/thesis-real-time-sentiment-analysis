from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.db.database import get_db
import backend.db.models as models
from fastapi.responses import JSONResponse
from sqlalchemy import cast, Numeric
from sqlalchemy.sql import func, case
import json

router = APIRouter()

@router.get("/timeline-tracker")
async def get_timeline_tracker(db: Session = Depends(get_db)):
    # Fetch aggregated timeline sentiment data
    try:
        results = (
            db.query(
                func.to_char(models.Tweets.created_at, "YYYY-MM").label("year_month"),
                func.to_char(models.Tweets.created_at, "Month").label("month_name"),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                models.Tweets.candidate.in_(["biden", "both"]),
                                models.Tweets.sentiment_score,
                            )
                        )
                    ), 0
                ).label("biden_sum_sentiment"),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                models.Tweets.candidate.in_(["trump", "both"]),
                                models.Tweets.sentiment_score,
                            )
                        )
                    ), 0
                ).label("trump_sum_sentiment"),
                func.sum(models.Tweets.sentiment_score).label("total_sum_sentiment"),
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
                "biden_sum_sentiment": row[2],
                "trump_sum_sentiment": row[3],
                "total_sum_sentiment": row[4],
            }
            for row in results
        ]

        return JSONResponse(content=json.loads(json.dumps(timeline_tracker)))

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
