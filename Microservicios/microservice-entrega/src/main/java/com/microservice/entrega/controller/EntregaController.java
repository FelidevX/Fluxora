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

    // Asignar driver a una ruta
    @PostMapping("/asignar-driver")
    public ResponseEntity<String> asignarDriver(@RequestBody Map<String, Object> datos) {
        try {
            Long idRuta = Long.valueOf(datos.get("id_ruta").toString());
            Long idDriver = Long.valueOf(datos.get("id_driver").toString());
            
            entregaService.asignarDriverARuta(idRuta, idDriver);
            return ResponseEntity.ok("Driver asignado exitosamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al asignar driver: " + e.getMessage());
        }
    }

    // Obtener rutas programadas por fecha específica
    @GetMapping("/rutas-por-fecha/{fecha}")
    public List<Map<String, Object>> getRutasProgramadasPorFecha(@PathVariable String fecha) {
        return entregaService.getRutasProgramadasPorFecha(fecha);
    }

    // Programar entregas individuales para clientes
    @PostMapping("/programar-entregas-individuales")
    public ResponseEntity<String> programarEntregasIndividuales(@RequestBody Map<String, Object> datos) {
        try {
            Long idRuta = Long.valueOf(datos.get("idRuta").toString());
            String fecha = datos.get("fecha").toString();
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> entregas = (List<Map<String, Object>>) datos.get("entregas");
            
            String mensaje = entregaService.programarEntregasIndividuales(idRuta, fecha, entregas);
            return ResponseEntity.ok(mensaje);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al programar entregas: " + e.getMessage());
        }
    }

    // Actualizar programación individual de un cliente
    @PostMapping("/actualizar-programacion-cliente")
    public ResponseEntity<String> actualizarProgramacionCliente(@RequestBody Map<String, Object> datos) {
        try {
            Long idRuta = Long.valueOf(datos.get("idRuta").toString());
            Long idCliente = Long.valueOf(datos.get("idCliente").toString());
            String fecha = datos.get("fecha").toString();
            Double kgCorriente = Double.valueOf(datos.get("kgCorriente").toString());
            Double kgEspecial = Double.valueOf(datos.get("kgEspecial").toString());
            
            String mensaje = entregaService.actualizarProgramacionCliente(idRuta, idCliente, fecha, kgCorriente, kgEspecial);
            return ResponseEntity.ok(mensaje);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al actualizar programación: " + e.getMessage());
        }
    }

    // Crear nueva ruta
    @PostMapping("/crear-ruta")
    public ResponseEntity<String> crearRuta(@RequestBody Map<String, Object> datosRuta) {
        try {
            String mensaje = entregaService.crearRuta(datosRuta);
            return ResponseEntity.ok(mensaje);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al crear ruta: " + e.getMessage());
        }
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
