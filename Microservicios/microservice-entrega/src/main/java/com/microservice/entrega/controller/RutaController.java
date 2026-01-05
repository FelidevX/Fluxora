package com.microservice.entrega.controller;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.microservice.entrega.service.RutaService;
import com.microservice.entrega.client.ClienteServiceClient;
import com.microservice.entrega.client.UsuarioServiceClient;
import com.microservice.entrega.dto.*;
import com.microservice.entrega.entity.Ruta;

@RestController
@RequestMapping("/rutas")
public class RutaController {

    private RutaService rutaService;
    private ClienteServiceClient clienteServiceClient;
    private UsuarioServiceClient usuarioServiceClient;

    public RutaController(RutaService rutaService, ClienteServiceClient clienteServiceClient,
            UsuarioServiceClient usuarioServiceClient) {
        this.rutaService = rutaService;
        this.clienteServiceClient = clienteServiceClient;
        this.usuarioServiceClient = usuarioServiceClient;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER')")
    @GetMapping("/optimized-ortools/{id_ruta}")
    public Map<String, Object> getOptimizedRouteORTools(@PathVariable Long id_ruta) {
        List<ClienteDTO> clientes = rutaService.getClientesDeRuta(id_ruta);
        List<ClienteDTO> orderedClients = rutaService.getOptimizedRouteORTools(id_ruta, clientes);
        Ruta origen = rutaService.getOrigenRuta(id_ruta);
        String osrmRoute = rutaService.getOsrmRoute(orderedClients, origen);

        Map<String, Object> result = new HashMap<>();
        result.put("orderedClients", orderedClients);
        result.put("osrmRoute", osrmRoute);

        Map<String, Object> origenInfo = new HashMap<>();
        origenInfo.put("latitud", origen.getLatitud());
        origenInfo.put("longitud", origen.getLongitud());
        result.put("origen", origenInfo);

        return result;
    }
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER')")
    @GetMapping("/optimized-ortools/{id_ruta}/{fecha}")
    public Map<String, Object> getOptimizedRouteORToolsForDate(
            @PathVariable Long id_ruta, 
            @PathVariable String fecha) {
        try {
            java.time.LocalDate fechaLocal = java.time.LocalDate.parse(fecha);
            
            // Obtener solo los clientes con programación de entregas para la fecha
            List<ClienteDTO> clientesConProgramacion = rutaService.getClientesConProgramacion(id_ruta, fechaLocal);
            
            if (clientesConProgramacion.isEmpty()) {
                Map<String, Object> result = new HashMap<>();
                result.put("orderedClients", new ArrayList<>());
                result.put("osrmRoute", null);
                result.put("message", "No hay entregas programadas para esta fecha");
                return result;
            }
            
            // Optimizar la ruta solo con esos clientes
            List<ClienteDTO> orderedClients = rutaService.getOptimizedRouteORTools(id_ruta, clientesConProgramacion);
            Ruta origen = rutaService.getOrigenRuta(id_ruta);
            String osrmRoute = rutaService.getOsrmRoute(orderedClients, origen);

            Map<String, Object> result = new HashMap<>();
            result.put("orderedClients", orderedClients);
            result.put("osrmRoute", osrmRoute);

            Map<String, Object> origenInfo = new HashMap<>();
            origenInfo.put("latitud", origen.getLatitud());
            origenInfo.put("longitud", origen.getLongitud());
            result.put("origen", origenInfo);

            return result;
        } catch (Exception e) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("error", "Error al optimizar la ruta: " + e.getMessage());
            return errorResult;
        }
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER')")
    @GetMapping("/clientes/{id_ruta}")
    public List<ClienteDTO> getClientesDeRuta(@PathVariable Long id_ruta) {
        return rutaService.getClientesDeRuta(id_ruta);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping()
    public List<Ruta> getAllRutas() {
        return rutaService.getAllRutas();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/clientes-sin-ruta")
    public List<ClienteDTO> getClientesSinRuta() {
        return rutaService.getClientesSinRuta();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/clientes-con-ruta")
    public List<ClienteConRutaDTO> getClientesConRuta() {
        return rutaService.getClientesConRuta();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/asignar-cliente")
    public ResponseEntity<String> asignarClienteARuta(@RequestBody Map<String, Long> request) {
        try {
            Long idRuta = request.get("id_ruta");
            Long idCliente = request.get("id_cliente");

            rutaService.asignarClienteARuta(idRuta, idCliente);
            return ResponseEntity.ok(("Cliente asignado correctamente a la ruta"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al asignar el cliente" + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/reasignar-cliente")
    public ResponseEntity<String> reasignarClienteARuta(@RequestBody Map<String, Long> request) {
        try {
            Long idRuta = request.get("id_ruta");
            Long idCliente = request.get("id_cliente");

            rutaService.reasignarClienteARuta(idRuta, idCliente);
            return ResponseEntity.ok("Cliente reasignado correctamente a la ruta");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al reasignar el cliente: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id_ruta}")
    public ResponseEntity<String> deleteRuta(@PathVariable Long id_ruta) {
        try {
            rutaService.deleteRuta(id_ruta);
            return ResponseEntity.ok("Ruta eliminada correctamente. Los clientes fueron desasignados.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al eliminar la ruta: " + e.getMessage());
        }
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER')")
    @GetMapping("/driver/{driverId}")
    public ResponseEntity<Map<String, Object>> getRutaIdByDriver(@PathVariable Long driverId) {
        try {
            Long rutaId = rutaService.getRutaIdByDriverId(driverId);
            Map<String, Object> response = new HashMap<>();
            response.put("rutaId", rutaId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "No se encontró una ruta para el driver con ID: " + driverId);
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER')")
    @PostMapping("/iniciar/{id_ruta}")
    public ResponseEntity<Map<String, Object>> iniciarRuta(@PathVariable Long id_ruta) {
        try {
            Long idPedido = rutaService.iniciarRuta(id_ruta);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Ruta iniciada correctamente");
            response.put("id_pedido", idPedido);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error al iniciar la ruta: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER')")
    @PostMapping("/finalizar/{id_ruta}")
    public ResponseEntity<Map<String, Object>> finalizarRuta(@PathVariable Long id_ruta) {
        try {
            rutaService.finalizarRuta(id_ruta);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Ruta finalizada correctamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error al finalizar la ruta: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER')")
    @GetMapping("/cliente/{idCliente}/ruta")
    public ResponseEntity<Map<String, Object>> getNombreRutaPorCliente(@PathVariable Long idCliente) {
        try {
            String nombreRuta = rutaService.getNombreRutaPorCliente(idCliente);
            Map<String, Object> response = new HashMap<>();
            
            if (nombreRuta != null) {
                response.put("nombreRuta", nombreRuta);
                response.put("tieneRuta", true);
            } else {
                response.put("nombreRuta", "Sin ruta asignada");
                response.put("tieneRuta", false);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error al obtener ruta del cliente: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER')")
    @GetMapping("/clientes/batch")
    public ResponseEntity<Map<String, String>> getNombresRutasPorClientes(
            @RequestParam("clienteIds") List<Long> clienteIds) {
        Map<String, String> resultado = rutaService.obtenerNombresRutasPorClientes(clienteIds);    
        return ResponseEntity.ok(resultado);
    }
}
