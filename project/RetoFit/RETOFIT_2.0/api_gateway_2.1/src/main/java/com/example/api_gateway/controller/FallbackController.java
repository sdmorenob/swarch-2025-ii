package com.example.api_gateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Controlador de fallback para Circuit Breaker.
 * Proporciona respuestas alternativas cuando los servicios están caídos o sobrecargados.
 */
@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @GetMapping("/auth")
    public ResponseEntity<Map<String, Object>> authFallback() {
        return createFallbackResponse("Authentication Service", 
            "El servicio de autenticación no está disponible temporalmente. Por favor, intente más tarde.");
    }

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> usersFallback() {
        return createFallbackResponse("Users Service", 
            "El servicio de usuarios no está disponible temporalmente. Por favor, intente más tarde.");
    }

    @GetMapping("/activities")
    public ResponseEntity<Map<String, Object>> activitiesFallback() {
        return createFallbackResponse("Activities Service", 
            "El servicio de actividades no está disponible temporalmente. Por favor, intente más tarde.");
    }

    @GetMapping("/gamification")
    public ResponseEntity<Map<String, Object>> gamificationFallback() {
        return createFallbackResponse("Gamification Service", 
            "El servicio de gamificación no está disponible temporalmente. Por favor, intente más tarde.");
    }

    @GetMapping("/posts")
    public ResponseEntity<Map<String, Object>> postsFallback() {
        return createFallbackResponse("Posts Service", 
            "El servicio de publicaciones no está disponible temporalmente. Por favor, intente más tarde.");
    }

    @GetMapping("/admin")
    public ResponseEntity<Map<String, Object>> adminFallback() {
        return createFallbackResponse("Admin Service", 
            "El servicio de administración no está disponible temporalmente. Por favor, intente más tarde.");
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> defaultFallback() {
        return createFallbackResponse("Service", 
            "El servicio solicitado no está disponible temporalmente. Por favor, intente más tarde.");
    }

    /**
     * Crea una respuesta de fallback estándar
     */
    private ResponseEntity<Map<String, Object>> createFallbackResponse(String serviceName, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("status", HttpStatus.SERVICE_UNAVAILABLE.value());
        response.put("error", "Service Unavailable");
        response.put("message", message);
        response.put("service", serviceName);
        response.put("circuitBreakerActivated", true);
        
        return ResponseEntity
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(response);
    }
}
