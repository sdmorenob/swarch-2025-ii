package com.proyecto.spring.social_service.repository.relations;

import com.proyecto.spring.social_service.model.relations.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // Spring crea la consulta SQL automáticamente a partir del nombre del método.
    // Usamos Optional porque el usuario podría no existir.
    Optional<Usuario> findByNombreUsuario(String nombreUsuario);

}
