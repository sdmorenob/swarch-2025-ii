from app.core.database import db

def run():
    recommendations = [
        {"user_id": 1, "event_ids": [101, 102]},
        {"user_id": 2, "event_ids": [103, 104]},
        {"user_id": 3, "event_ids": [101, 103]},
        {"user_id": 4, "event_ids": [102, 104]}
    ]

    db["recommendations"].insert_many(recommendations)
    print("Migration 001 completed.")