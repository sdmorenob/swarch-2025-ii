package co.edu.unal.campus.repositories;

import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

import co.edu.unal.campus.models.User;

@Repository
public interface UserRepository extends ReactiveCrudRepository<User, Long> {

}