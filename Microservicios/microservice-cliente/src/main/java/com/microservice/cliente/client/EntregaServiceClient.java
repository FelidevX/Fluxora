package com.microservice.cliente.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.microservice.cliente.config.FeignClientInterceptor;

@FeignClient(name = "microservice-entrega", configuration = FeignClientInterceptor.class)
public interface EntregaServiceClient {
    
    @DeleteMapping("/api/entregas/entrega/cliente/{idCliente}/relaciones")
    ResponseEntity<String> eliminarRelacionesCliente(@PathVariable("idCliente") Long idCliente);
}
