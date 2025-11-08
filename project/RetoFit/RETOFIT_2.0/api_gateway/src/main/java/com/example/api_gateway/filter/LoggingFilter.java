package com.example.api_gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class LoggingFilter implements GlobalFilter, Ordered {

    private static final Logger logger = LoggerFactory.getLogger(LoggingFilter.class);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // Log antes de procesar la petición
        logger.info("Request: {} {}", 
            exchange.getRequest().getMethod(), 
            exchange.getRequest().getURI());
        
        // Continuar con la cadena de filtros y log después de la respuesta
        return chain.filter(exchange).then(Mono.fromRunnable(() -> {
            logger.info("Response: Status code {}", 
                exchange.getResponse().getStatusCode());
        }));
    }

    @Override
    public int getOrder() {
        return -1; // Ejecutar primero
    }
}