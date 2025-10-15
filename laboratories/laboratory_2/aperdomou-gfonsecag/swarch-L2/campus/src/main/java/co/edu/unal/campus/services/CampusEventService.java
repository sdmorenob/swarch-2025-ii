package co.edu.unal.campus.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import co.edu.unal.campus.clients.grpc.GrpcRecommendationClient;
import co.edu.unal.campus.models.CampusEvent;
import co.edu.unal.campus.repositories.CampusEventRepository;


@Service
@RequiredArgsConstructor
public class CampusEventService {

    private final CampusEventRepository campusEventRepository;
	private final GrpcRecommendationClient grpcRecommendationClient;


    public Flux<CampusEvent> getEvents() {
        return campusEventRepository.findAll();
    }

    public Flux<CampusEvent> getRecommendedEvents(int userId, int limit) {
		return grpcRecommendationClient.recommend(userId, limit)
				.flatMapMany(Flux::fromIterable)
                .map(Integer::longValue)
                .flatMapSequential(campusEventRepository::findById)
                .take(limit);
	}

}