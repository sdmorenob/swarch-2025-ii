package co.edu.unal.campus.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import co.edu.unal.campus.models.User;
import co.edu.unal.campus.services.UserService;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;


@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;


    @GetMapping("/users/{id}")
    public Mono<User> getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

}