package com.example.api_gateway.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.util.Optional;

@Configuration
public class RateLimiterConfig {

    // 1) KeyResolver por IP usando X-Forwarded-For (preferible detrás de Nginx)
    @Bean
    public KeyResolver ipKeyResolver() {
        return exchange -> {
            String xff = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
            if (xff != null && !xff.isEmpty()) {
                String ip = xff.split(",")[0].trim(); // primer valor en la lista
                return Mono.just(ip);
            }
            // Fallback a la dirección remota
            return Mono.justOrEmpty(exchange.getRequest().getRemoteAddress())
                       .map(InetSocketAddress::getAddress)
                       .map(a -> a.getHostAddress())
                       .defaultIfEmpty("unknown-ip");
        };
    }

    // 2) KeyResolver por usuario (requiere que tu Gateway tenga principal/JWT)
    @Bean
    public KeyResolver userKeyResolver() {
        return exchange ->
            exchange.getPrincipal()
                    .map(principal -> {
                        // si usas JWT con resource server, Principal puede contener subject
                        return principal.getName(); // o accede a claims si usas JwtAuthenticationToken
                    })
                    .defaultIfEmpty("anonymous");
    }

    // 3) KeyResolver compuesto user:ip (muy recomendable)
    @Bean
    @Primary
    public KeyResolver userIpKeyResolver() {
        return exchange -> {

            // Resolver USER (con fallback a anon)
            Mono<String> userMono = exchange.getPrincipal()
                    .map(p -> p.getName())
                    .defaultIfEmpty("anon");

            // Resolver IP siempre de forma segura
            String ip = Optional.ofNullable(
                    exchange.getRequest().getHeaders().getFirst("X-Forwarded-For")
            )
            .map(v -> v.split(",")[0].trim())
            .orElseGet(() -> {
                // FALLBACK: RemoteAddress puede ser NULL
                InetSocketAddress addr = exchange.getRequest().getRemoteAddress();
                if (addr != null && addr.getAddress() != null) {
                    return addr.getAddress().getHostAddress();
                }
                return "unknown-ip";
            });

            return userMono.map(user -> user + ":" + ip);
        };
    }
}

