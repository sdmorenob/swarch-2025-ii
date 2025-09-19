package co.edu.unal.campus.controllers;

import org.springframework.web.bind.annotation.RestController;

import co.edu.unal.campus.models.CampusEvent;
import co.edu.unal.campus.services.CampusEventService;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.GetMapping;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;


@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
public class CampusEventController {

	private final CampusEventService campusEventService;


	@GetMapping("/events")
	public Flux<CampusEvent> getEvents() {
		return campusEventService.getEvents();
	}

	@GetMapping("/events/recommendations")
	public Flux<CampusEvent> getRecommendedEvents(@RequestParam("userId") int userId, @RequestParam("limit") int limit) {
		return campusEventService.getRecommendedEvents(userId, limit);
	}

}