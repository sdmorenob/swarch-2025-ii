package co.edu.unal.campus.services;

import org.springframework.stereotype.Service;

import co.edu.unal.campus.models.User;
import co.edu.unal.campus.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;


@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;


    public Mono<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

}