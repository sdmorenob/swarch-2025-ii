package co.edu.unal.campus.repositories;

import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

import co.edu.unal.campus.models.Rsvp;
import reactor.core.publisher.Flux;


@Repository
public interface RsvpRepository extends ReactiveCrudRepository<Rsvp, Long> {

    Flux<Rsvp> findByEventId(Long eventId);

    Flux<Rsvp> findByUserId(Long userId);

}