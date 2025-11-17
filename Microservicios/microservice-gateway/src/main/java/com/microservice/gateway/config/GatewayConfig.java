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
                        .filters(f -> f.stripPrefix(2)) // Remueve /api/usuarios
                        .uri("lb://MICROSERVICE-USUARIO"))
                
                // Ruta para microservicio de clientes
                .route("clientes-service", r -> r
                        .path("/api/clientes/**")
                        .filters(f -> f.stripPrefix(2))
                        .uri("lb://MICROSERVICE-CLIENTE"))
                
                // Ruta para microservicio de inventario
                .route("inventario-service", r -> r
                        .path("/api/inventario/**")
                        .filters(f -> f.stripPrefix(2))
                        .uri("lb://MICROSERVICE-INVENTARIO"))
                
                // Ruta para microservicio de entregas
                .route("entregas-service", r -> r
                        .path("/api/entregas/**")
                        .filters(f -> f.stripPrefix(2))
                        .uri("lb://MICROSERVICE-ENTREGA"))
                
                .build();
    }
}
