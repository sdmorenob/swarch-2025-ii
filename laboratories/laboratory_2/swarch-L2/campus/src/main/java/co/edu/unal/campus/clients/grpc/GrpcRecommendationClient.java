package co.edu.unal.campus.clients.grpc;

import java.util.List;
import java.util.concurrent.CompletableFuture;

import com.google.common.util.concurrent.ListenableFuture;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import co.edu.unal.campus.protos.RecommendRequest;
import co.edu.unal.campus.protos.RecommendResponse;
import co.edu.unal.campus.protos.RecommendationGrpc.RecommendationFutureStub;


@Component
@RequiredArgsConstructor
public class GrpcRecommendationClient {

    private final RecommendationFutureStub stub;


    public Mono<List<Integer>> recommend(int userId, int limit) {
        var req = RecommendRequest.newBuilder()
                .setUserId(userId)
                .setLimit(limit)
                .build();

        ListenableFuture<RecommendResponse> listenableFuture = stub.recommend(req);

        // Convert ListenableFuture to CompletableFuture
        CompletableFuture<RecommendResponse> completableFuture = new CompletableFuture<>();
        listenableFuture.addListener(() -> {
            try {
              completableFuture.complete(listenableFuture.get());
            } catch (Exception e) {
              completableFuture.completeExceptionally(e);
            }
        }, Runnable::run);

        return Mono.fromFuture(completableFuture)
                  .map(RecommendResponse::getEventIdsList);
    }

}