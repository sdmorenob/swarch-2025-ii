from app.core.database import recommendations_col
from .generated import recommendation_pb2 as pb2
from .generated import recommendation_pb2_grpc as pb2g


class RecommendationServicer(pb2g.RecommendationServicer):
    async def Recommend(self, request: pb2.RecommendRequest, context):
        user_id = request.user_id
        limit = request.limit or 100

        recommendations = await recommendations_col.find_one({"user_id": int(user_id)})
        if not recommendations:
            return pb2.RecommendResponse(event_ids=[])

        event_ids = recommendations["event_ids"][:limit]
        event_ids = [int(eid) for eid in event_ids]

        return pb2.RecommendResponse(event_ids=event_ids)
