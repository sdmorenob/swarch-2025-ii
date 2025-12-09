package com.example.api_gateway.controller;

import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controlador para monitorear el estado de los Circuit Breakers.
 * Proporciona endpoints para verificar la salud y estado de cada circuito.
 */
@RestController
@RequestMapping("/actuator/circuit-breakers")
public class CircuitBreakerMonitorController {

    @Autowired(required = false)
    private CircuitBreakerRegistry circuitBreakerRegistry;

    /**
     * Obtiene el estado de todos los Circuit Breakers
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllCircuitBreakers() {
        if (circuitBreakerRegistry == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Circuit Breaker Registry not available");
            return ResponseEntity.ok(response);
        }

        Map<String, Object> circuitBreakers = circuitBreakerRegistry.getAllCircuitBreakers()
                .stream()
                .collect(Collectors.toMap(
                        CircuitBreaker::getName,
                        cb -> {
                            Map<String, Object> cbInfo = new HashMap<>();
                            cbInfo.put("state", cb.getState().toString());
                            cbInfo.put("failureRate", cb.getMetrics().getFailureRate());
                            cbInfo.put("numberOfBufferedCalls", cb.getMetrics().getNumberOfBufferedCalls());
                            cbInfo.put("numberOfFailedCalls", cb.getMetrics().getNumberOfFailedCalls());
                            cbInfo.put("numberOfSuccessfulCalls", cb.getMetrics().getNumberOfSuccessfulCalls());
                            return cbInfo;
                        }
                ));

        return ResponseEntity.ok(circuitBreakers);
    }

    /**
     * Obtiene el estado de un Circuit Breaker específico
     */
    @GetMapping("/{name}")
    public ResponseEntity<Map<String, Object>> getCircuitBreaker(@PathVariable String name) {
        if (circuitBreakerRegistry == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Circuit Breaker Registry not available");
            return ResponseEntity.ok(response);
        }

        try {
            CircuitBreaker circuitBreaker = circuitBreakerRegistry.circuitBreaker(name);
            Map<String, Object> cbInfo = new HashMap<>();
            cbInfo.put("name", circuitBreaker.getName());
            cbInfo.put("state", circuitBreaker.getState().toString());
            cbInfo.put("failureRate", circuitBreaker.getMetrics().getFailureRate());
            cbInfo.put("slowCallRate", circuitBreaker.getMetrics().getSlowCallRate());
            cbInfo.put("numberOfBufferedCalls", circuitBreaker.getMetrics().getNumberOfBufferedCalls());
            cbInfo.put("numberOfFailedCalls", circuitBreaker.getMetrics().getNumberOfFailedCalls());
            cbInfo.put("numberOfSuccessfulCalls", circuitBreaker.getMetrics().getNumberOfSuccessfulCalls());
            cbInfo.put("numberOfSlowCalls", circuitBreaker.getMetrics().getNumberOfSlowCalls());
            cbInfo.put("numberOfNotPermittedCalls", circuitBreaker.getMetrics().getNumberOfNotPermittedCalls());

            return ResponseEntity.ok(cbInfo);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "Circuit Breaker not found: " + name);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Endpoint de salud simple
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("circuitBreakersEnabled", circuitBreakerRegistry != null);
        
        if (circuitBreakerRegistry != null) {
            health.put("totalCircuitBreakers", circuitBreakerRegistry.getAllCircuitBreakers().size());
        }
        
        return ResponseEntity.ok(health);
    }
}
