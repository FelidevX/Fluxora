package com.microservice.cliente.client;

import java.util.List;
import java.util.Map;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import com.microservice.cliente.config.FeignClientInterceptor;

@FeignClient(name = "microservice-entrega", configuration = FeignClientInterceptor.class)
public interface EntregaServiceClient {
    
    @DeleteMapping("/api/entregas/entrega/cliente/{idCliente}/relaciones")
    ResponseEntity<String> eliminarRelacionesCliente(@PathVariable("idCliente") Long idCliente);
    
    @GetMapping("/api/entregas/rutas/cliente/{idCliente}/ruta")
    ResponseEntity<Map<String, Object>> getNombreRutaPorCliente(@PathVariable("idCliente") Long idCliente);
    
    @GetMapping("/api/entregas/rutas/clientes/batch")
    ResponseEntity<Map<String, String>> getNombresRutasPorClientes(
        @RequestParam("clienteIds") List<Long> clienteIds
    );
}
