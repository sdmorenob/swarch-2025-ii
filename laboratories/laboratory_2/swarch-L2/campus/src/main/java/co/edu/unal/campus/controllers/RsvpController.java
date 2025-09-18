package co.edu.unal.campus.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import co.edu.unal.campus.models.Rsvp;
import co.edu.unal.campus.services.RsvpService;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;


@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
public class RsvpController {

    private final RsvpService rsvpService;


    @GetMapping("/rsvps/event/{eventId}")
    public Flux<Rsvp> getRsvpsByEventId(@PathVariable Long eventId) {
        return rsvpService.getRsvpsByEventId(eventId);
    }

    @GetMapping("/rsvps/user/{userId}")
    public Flux<Rsvp> getRsvpsByUserId(@PathVariable Long userId) {
        return rsvpService.getRsvpsByUserId(userId);
    }

}