package com.proyecto.spring.social_service.controllers;

import com.proyecto.spring.social_service.model.EstadoSolicitud;
import com.proyecto.spring.social_service.model.SolicitudAmistad;
import com.proyecto.spring.social_service.model.Usuario;
import com.proyecto.spring.social_service.repository.SolicitudAmistadRepository;
import com.proyecto.spring.social_service.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/social")
public class SocialApiController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private SolicitudAmistadRepository solicitudAmistadRepository;

    // Endpoint 2: Obtener detalles de un usuario específico
    @GetMapping("/usuarios/{id}")
    public ResponseEntity<?> obtenerUsuario(@PathVariable Long id) {
        try {
            Optional<Usuario> usuarioOpt = usuarioRepository.findById(id);

            if (usuarioOpt.isPresent()) {
                return ResponseEntity.ok(usuarioOpt.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ErrorRespuesta("Error al obtener usuario: " + e.getMessage()));
        }
    }

    // Endpoint 3: Enviar solicitud de amistad (usando RequestBody)
    @PostMapping("/solicitudes/enviar")
    public ResponseEntity<?> enviarSolicitudAmistad(@RequestBody SolicitudAmistadRequest request) {
        try {
            Long solicitanteId = request.getSolicitanteId();
            Long receptorId = request.getReceptorId();

            // Validaciones básicas
            if (solicitanteId == null || receptorId == null) {
                return ResponseEntity.badRequest()
                        .body(new ErrorRespuesta("solicitanteId y receptorId son requeridos"));
            }

            // Verificar que ambos usuarios existen
            Optional<Usuario> solicitanteOpt = usuarioRepository.findById(solicitanteId);
            Optional<Usuario> receptorOpt = usuarioRepository.findById(receptorId);

            if (!solicitanteOpt.isPresent() || !receptorOpt.isPresent()) {
                return ResponseEntity.badRequest()
                        .body(new ErrorRespuesta("Uno o ambos usuarios no existen"));
            }

            // Verificar que no son el mismo usuario
           if (solicitanteId.equals(receptorId)) {
                return ResponseEntity.badRequest()
                         .body(new ErrorRespuesta("No puedes enviarte una solicitud a ti mismo"));
            }

            // Verificar si ya existe una solicitud pendiente
            boolean solicitudExistente = solicitudAmistadRepository.findAll().stream()
                    .anyMatch(solicitud -> solicitud.getSolicitante().getIdUsuario().equals(solicitanteId) &&
                            solicitud.getReceptor().getIdUsuario().equals(receptorId) &&
                            solicitud.getEstado() == EstadoSolicitud.PENDIENTE);

            if (solicitudExistente) {
                return ResponseEntity.badRequest()
                        .body(new ErrorRespuesta("Ya existe una solicitud pendiente entre estos usuarios"));
            }

            // Crear y guardar la nueva solicitud
            Usuario solicitante = solicitanteOpt.get();
            Usuario receptor = receptorOpt.get();

            SolicitudAmistad nuevaSolicitud = new SolicitudAmistad(solicitante, receptor);
            solicitudAmistadRepository.save(nuevaSolicitud);

            return ResponseEntity.ok(new MensajeRespuesta("Solicitud de amistad enviada exitosamente"));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ErrorRespuesta("Error al enviar solicitud: " + e.getMessage()));
        }
    }

    // Endpoint 4: Aceptar solicitud de amistad
    @PutMapping("/solicitudes/{solicitudId}/aceptar")
    public ResponseEntity<?> aceptarSolicitud(@PathVariable Long solicitudId) {
        try {
            Optional<SolicitudAmistad> solicitudOpt = solicitudAmistadRepository.findById(solicitudId);

            if (!solicitudOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            SolicitudAmistad solicitud = solicitudOpt.get();
            solicitud.setEstado(EstadoSolicitud.ACEPTADA);
            solicitudAmistadRepository.save(solicitud);

            return ResponseEntity.ok(new MensajeRespuesta("Solicitud de amistad aceptada"));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ErrorRespuesta("Error al aceptar solicitud: " + e.getMessage()));
        }
    }

    // Endpoint 5: Rechazar solicitud de amistad
    @PutMapping("/solicitudes/{solicitudId}/rechazar")
    public ResponseEntity<?> rechazarSolicitud(@PathVariable Long solicitudId) {
        try {
            Optional<SolicitudAmistad> solicitudOpt = solicitudAmistadRepository.findById(solicitudId);

            if (!solicitudOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            SolicitudAmistad solicitud = solicitudOpt.get();
            solicitud.setEstado(EstadoSolicitud.RECHAZADA);
            solicitudAmistadRepository.save(solicitud);

            return ResponseEntity.ok(new MensajeRespuesta("Solicitud de amistad rechazada"));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ErrorRespuesta("Error al rechazar solicitud: " + e.getMessage()));
        }
    }

    // Endpoint 6: Obtener solicitudes pendientes de un usuario
    @GetMapping("/usuarios/{usuarioId}/solicitudes-pendientes")
    public ResponseEntity<?> obtenerSolicitudesPendientes(@PathVariable Long usuarioId) {
        try {
            List<SolicitudAmistad> todasSolicitudes = solicitudAmistadRepository.findAll();

            List<SolicitudAmistad> solicitudesPendientes = todasSolicitudes.stream()
                    .filter(solicitud -> solicitud.getReceptor().getIdUsuario().equals(usuarioId) &&
                            solicitud.getEstado() == EstadoSolicitud.PENDIENTE)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(solicitudesPendientes);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ErrorRespuesta("Error al obtener solicitudes: " + e.getMessage()));
        }
    }

    // Endpoint 7: Obtener amigos de un usuario
    @GetMapping("/usuarios/{usuarioId}/amigos")
    public ResponseEntity<?> obtenerAmigos(@PathVariable Long usuarioId) {
        try {
            List<SolicitudAmistad> todasSolicitudes = solicitudAmistadRepository.findAll();

            List<Usuario> amigos = todasSolicitudes.stream()
                    .filter(solicitud -> (solicitud.getSolicitante().getIdUsuario().equals(usuarioId) ||
                            solicitud.getReceptor().getIdUsuario().equals(usuarioId)) &&
                            solicitud.getEstado() == EstadoSolicitud.ACEPTADA)
                    .map(solicitud -> {
                        if (solicitud.getSolicitante().getIdUsuario().equals(usuarioId)) {
                            return solicitud.getReceptor();
                        } else {
                            return solicitud.getSolicitante();
                        }
                    })
                    .distinct()
                    .collect(Collectors.toList());

            return ResponseEntity.ok(amigos);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ErrorRespuesta("Error al obtener amigos: " + e.getMessage()));
        }
    }

    // Endpoint 8: Obtener todos los usuarios (para testing)
    @GetMapping("/usuarios")
    public ResponseEntity<?> obtenerTodosUsuarios() {
        try {
            List<Usuario> usuarios = usuarioRepository.findAll();
            return ResponseEntity.ok(usuarios);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ErrorRespuesta("Error al obtener usuarios: " + e.getMessage()));
        }
    }
}