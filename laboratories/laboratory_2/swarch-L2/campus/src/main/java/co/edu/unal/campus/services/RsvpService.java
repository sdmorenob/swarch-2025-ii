package co.edu.unal.campus.services;

import org.springframework.stereotype.Service;

import co.edu.unal.campus.models.Rsvp;
import co.edu.unal.campus.repositories.RsvpRepository;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;


@Service
@RequiredArgsConstructor
public class RsvpService {

    private final RsvpRepository rsvpRepository;

    public Flux<Rsvp> getRsvpsByEventId(Long eventId) {
        var rsvp = rsvpRepository.findByEventId(eventId);
        return rsvp;
    }

    public Flux<Rsvp> getRsvpsByUserId(Long userId) {
        return rsvpRepository.findByUserId(userId);
    }

}