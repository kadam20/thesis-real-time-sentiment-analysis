from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.db.database import get_db
import backend.db.models as models
from fastapi.responses import JSONResponse
from sqlalchemy import cast, Numeric
from sqlalchemy.sql import func, case
import json


router = APIRouter()

@router.get("/election-map")
async def get_election_map(db: Session = Depends(get_db)):
    # Fetch aggregated election sentiment data by state
    try:
        results = (
            db.query(
                models.Tweets.state_code,
                func.round(
                    cast(
                        func.sum(
                           models.Tweets.sentiment_score
                        ),
                        Numeric,
                    ),
                    2,
                ).label("total_avg_sentiment"),
                func.round(
                    cast(
                        func.sum(
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
                        func.sum(
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
                "total_sentiment": float(row[1]) if row[1] is not None else None,
                "biden_sentiment": float(row[2]) if row[2] is not None else None,
                "biden_count": row[3],
                "trump_sentiment": float(row[4]) if row[4] is not None else None,
                "trump_count": row[5],
            }
            for row in results
        ]

        return JSONResponse(content=json.loads(json.dumps(election_map)))

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    

@router.get("/election-map-test")
async def get_election_map(db: Session = Depends(get_db)):
    try:
        # Select all states and left join with tweets
        results = (
            db.query(
             models.State.state_name,)
            .all()
        )

        # Create election sentiment data list
        election_map = [
            {
                "state_code": row[0],
"state_name": row[1],
                "total_avg_sentiment": float(row[1]) if row[1] is not None else None,
                "biden_avg_sentiment": float(row[2]) if row[2] is not None else None,
                "biden_count": row[3],
                "trump_avg_sentiment": float(row[4]) if row[4] is not None else None,
                "trump_count": row[5],
            }
            for row in results  # Include state_name
        ]

        return JSONResponse(content=json.loads(json.dumps(election_map)))

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@router.get("/states")
async def get_states(db: Session = Depends(get_db)):
    try:
        # Select only state_code and state_name from State
        results = db.query(models.State.state_code, models.State.state_name).all()

        states = [
            {"state_code": row.state_code, "state_name": row.state_name}
            for row in results
        ]

        return JSONResponse(content=json.loads(json.dumps(states)))

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)