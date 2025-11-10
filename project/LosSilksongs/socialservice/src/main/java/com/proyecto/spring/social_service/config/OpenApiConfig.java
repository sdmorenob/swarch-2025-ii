package com.proyecto.spring.social_service.config;

import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.OpenAPI;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI socialServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Social Service API")
                        .version("1.0")
                        .description("API REST del servicio social del proyecto MusicShare"));
    }
}