package co.edu.unal.campus.repositories;

import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

import co.edu.unal.campus.models.CampusEvent;


@Repository
public interface CampusEventRepository extends ReactiveCrudRepository<CampusEvent, Long> {
    
}