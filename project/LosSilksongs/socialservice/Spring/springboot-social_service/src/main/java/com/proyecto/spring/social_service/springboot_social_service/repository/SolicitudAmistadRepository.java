package com.proyecto.spring.social_service.springboot_social_service.repository;

import com.proyecto.spring.social_service.springboot_social_service.model.SolicitudAmistad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SolicitudAmistadRepository extends JpaRepository<SolicitudAmistad, Long> {

    // Por ahora no necesitamos métodos personalizados aquí.
    // JpaRepository ya nos da los métodos básicos como save(), findById(),
    // findAll(), etc.

}