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
                func.count(
                    case(
                        (
                            models.Tweets.candidate.in_(["biden", "both"]),
                            models.Tweets.sentiment_score,
                        )
                    )
                ).label("biden_count"),
                func.count(
                    case(
                        (
                            models.Tweets.candidate.in_(["trump", "both"]),
                            models.Tweets.sentiment_score,
                        )
                    )
                ).label("trump_count"),
                func.sum(
                    case(
                        (
                            models.Tweets.candidate.in_(["biden", "both"]),
                            models.Tweets.sentiment_score,
                        )
                    )
                ).label("biden_sum_sentiment"),
                func.sum(
                    case(
                        (
                            models.Tweets.candidate.in_(["trump", "both"]),
                            models.Tweets.sentiment_score,
                        )
                    )
                ).label("trump_sum_sentiment"),
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
                "biden_count": row[5],
                "trump_count": row[6],
                "biden_sum_sentiment": row[7],
                "trump_sum_sentiment": row[8],
            }
            for row in results
        ]

        return JSONResponse(content=json.loads(json.dumps(timeline_tracker)))

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
