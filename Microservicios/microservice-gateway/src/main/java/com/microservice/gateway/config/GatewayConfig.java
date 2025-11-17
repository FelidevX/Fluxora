package com.microservice.gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                // Ruta para microservicio de usuarios
                .route("usuarios-service", r -> r
                        .path("/api/usuarios/**")
                        .uri("lb://MICROSERVICE-USUARIO"))
                
                // Ruta para microservicio de clientes
                .route("clientes-service", r -> r
                        .path("/api/clientes/**")
                        .uri("lb://MICROSERVICE-CLIENTE"))
                
                // Ruta para microservicio de inventario
                .route("inventario-service", r -> r
                        .path("/api/inventario/**")
                        .uri("lb://MICROSERVICE-INVENTARIO"))
                
                // Ruta para microservicio de entregas
                .route("entregas-service", r -> r
                        .path("/api/entregas/**")
                        .uri("lb://MICROSERVICE-ENTREGA"))
                
                .build();
    }
}
