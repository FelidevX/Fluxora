package com.microservice.entrega.controller;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
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

    @GetMapping("/optimized-ortools/{id_ruta}")
    public Map<String, Object> getOptimizedRouteORTools(@PathVariable Long id_ruta) {
        List<ClienteDTO> clientes = rutaService.getClientesDeRuta(id_ruta);
        List<ClienteDTO> orderedClients = rutaService.getOptimizedRouteORTools(clientes);
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

    @GetMapping("/test-optimization")
    public ResponseEntity<Map<String, Object>> testRouteOptimization() {
        Map<String, Object> result = new HashMap<>();
        try {
            List<ClienteDTO> testClientes = Arrays.asList(
                    createTestCliente(1L, "Cliente A", -34.6037, -58.3816), // Buenos Aires
                    createTestCliente(2L, "Cliente B", -34.6118, -58.3960), // Palermo
                    createTestCliente(3L, "Cliente C", -34.5875, -58.3974), // Recoleta
                    createTestCliente(4L, "Cliente D", -34.6092, -58.3731) // Puerto Madero
            );

            result.put("testClientes", testClientes);

            List<ClienteDTO> optimizedRoute = rutaService.getOptimizedRouteORTools(testClientes);
            result.put("optimizedRoute", optimizedRoute);

            Ruta origen = rutaService.getOrigenRuta(1L);
            result.put("origen", origen);

            String osrmRoute = rutaService.getOsrmRoute(optimizedRoute, origen);
            result.put("osrmRoute", osrmRoute);

            result.put("status", "SUCCESS");
            result.put("message", "Optimización exitosa");
        } catch (Exception e) {
            result.put("status", "ERROR");
            result.put("message", "Error al optimizar la ruta" + e.getMessage());
            result.put("error", e.getClass().getSimpleName());
        }
        return ResponseEntity.ok(result);
    }

    private ClienteDTO createTestCliente(Long id, String nombre, Double latitud, Double longitud) {
        ClienteDTO cliente = new ClienteDTO();
        cliente.setId(id);
        cliente.setNombre(nombre);
        cliente.setLatitud(latitud);
        cliente.setLongitud(longitud);
        return cliente;
    }

    @GetMapping("/clientes/{id_ruta}")
    public List<ClienteDTO> getClientesDeRuta(@PathVariable Long id_ruta) {
        return rutaService.getClientesDeRuta(id_ruta);
    }

    @GetMapping()
    public List<Ruta> getAllRutas() {
        return rutaService.getAllRutas();
    }

    @GetMapping("/clientes-sin-ruta")
    public List<ClienteDTO> getClientesSinRuta() {
        return rutaService.getClientesSinRuta();
    }

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
}
