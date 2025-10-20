package com.proyecto.spring.social_service.springboot_social_service.repository;

import com.proyecto.spring.social_service.springboot_social_service.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // Spring crea la consulta SQL automáticamente a partir del nombre del método.
    // Usamos Optional porque el usuario podría no existir.
    Optional<Usuario> findByNombreUsuario(String nombreUsuario);

}
