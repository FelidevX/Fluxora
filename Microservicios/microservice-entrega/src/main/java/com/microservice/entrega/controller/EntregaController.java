package com.microservice.entrega.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.microservice.entrega.dto.ClienteDTO;
import com.microservice.entrega.entity.RegistroEntrega;
import com.microservice.entrega.entity.Ruta;
import com.microservice.entrega.service.EntregaService;

@RestController
@RequestMapping("/entrega")
public class EntregaController {

    @Autowired
    private EntregaService entregaService;

    // Obtener todas las rutas activas con sus clientes
    @GetMapping("/rutas-activas")
    public List<Map<String, Object>> getRutasActivas() {
        return entregaService.getRutasActivas();
    }

    // Obtener clientes de una ruta específica con información de entregas
    @GetMapping("/ruta/{id}/clientes")
    public List<Map<String, Object>> getClientesDeRutaConEntregas(@PathVariable Long id) {
        return entregaService.getClientesDeRutaConEntregas(id);
    }

    // Registrar entrega a un cliente
    @PostMapping("/registrar")
    public ResponseEntity<String> registrarEntrega(@RequestBody RegistroEntrega registroEntrega) {
        try {
            entregaService.registrarEntrega(registroEntrega);
            return ResponseEntity.ok("Entrega registrada exitosamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al registrar entrega: " + e.getMessage());
        }
    }

    // Obtener historial de entregas de un cliente
    @GetMapping("/cliente/{id}/historial")
    public List<RegistroEntrega> getHistorialEntregas(@PathVariable Long id) {
        return entregaService.getHistorialEntregasCliente(id);
    }

    // Obtener entregas de un conductor/ruta
    @GetMapping("/conductor/{id}/entregas")
    public List<Map<String, Object>> getEntregasConductor(@PathVariable Long id) {
        return entregaService.getEntregasConductor(id);
    }

    // Obtener historial completo de todas las entregas
    @GetMapping("/historial")
    public List<Map<String, Object>> getHistorialCompleto() {
        return entregaService.getHistorialCompleto();
    }

    // ENDPOINT TEMPORAL PARA DATOS DE PRUEBA - REMOVER EN PRODUCCIÓN
    @PostMapping("/setup-datos-prueba")
    public ResponseEntity<String> setupDatosPrueba() {
        try {
            entregaService.crearDatosPrueba();
            return ResponseEntity.ok("Datos de prueba creados exitosamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al crear datos de prueba: " + e.getMessage());
        }
    }
}
