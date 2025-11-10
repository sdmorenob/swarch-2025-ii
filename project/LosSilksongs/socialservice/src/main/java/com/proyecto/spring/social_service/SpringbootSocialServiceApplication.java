package com.proyecto.spring.social_service;

import com.proyecto.spring.social_service.model.SolicitudAmistad;
import com.proyecto.spring.social_service.model.Usuario;
import com.proyecto.spring.social_service.repository.SolicitudAmistadRepository;
import com.proyecto.spring.social_service.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Optional;

@SpringBootApplication
public class SpringbootSocialServiceApplication implements CommandLineRunner {

	private final UsuarioRepository usuarioRepository;
	private final SolicitudAmistadRepository solicitudAmistadRepository;

	// Actualizamos el constructor para que Spring nos inyecte AMBOS repositorios
	public SpringbootSocialServiceApplication(UsuarioRepository usuarioRepository,
			SolicitudAmistadRepository solicitudAmistadRepository) {
		this.usuarioRepository = usuarioRepository;
		this.solicitudAmistadRepository = solicitudAmistadRepository;
	}

	public static void main(String[] args) {
		SpringApplication.run(SpringbootSocialServiceApplication.class, args);
	}

	@Override
	@Transactional // Es buena práctica para operaciones que involucran varias escrituras
	public void run(String... args) throws Exception {
		System.out.println("======================================================");
		System.out.println("INICIANDO APLICACIÓN Y POBLANDO DATOS DE PRUEBA...");
		System.out.println("======================================================");

		// Buscamos a los usuarios por su nombre para obtener sus objetos completos
		Optional<Usuario> andresOpt = usuarioRepository.findByNombreUsuario("Andres");
		Optional<Usuario> mariaOpt = usuarioRepository.findByNombreUsuario("Maria");
		Optional<Usuario> carlosOpt = usuarioRepository.findByNombreUsuario("Carlos");
		Optional<Usuario> luisaOpt = usuarioRepository.findByNombreUsuario("Luisa");

		// Verificamos que los usuarios existan antes de crear las solicitudes
		if (andresOpt.isPresent() && mariaOpt.isPresent() && carlosOpt.isPresent() && luisaOpt.isPresent()) {
			Usuario andres = andresOpt.get();
			Usuario maria = mariaOpt.get();
			Usuario carlos = carlosOpt.get();
			Usuario luisa = luisaOpt.get();

			System.out.println("Usuarios encontrados. Creando solicitudes de amistad...");

			if (solicitudAmistadRepository.count() == 0) {
				// Creamos los objetos de solicitud en Java
			SolicitudAmistad sol1 = new SolicitudAmistad(andres, maria);
			SolicitudAmistad sol2 = new SolicitudAmistad(carlos, andres);
			SolicitudAmistad sol3 = new SolicitudAmistad(luisa, maria);

			// Guardamos todas las solicitudes en la base de datos en una sola operación
			solicitudAmistadRepository.saveAll(Arrays.asList(sol1, sol2, sol3));

			System.out.println("¡Solicitudes de amistad creadas exitosamente!");
			}


		} else {
			System.err.println("No se encontraron todos los usuarios necesarios para crear las solicitudes.");
		}

		System.out.println("\n======================================================");
		System.out.println("INICIALIZACIÓN COMPLETA.");
		System.out.println("======================================================");
	}
}
