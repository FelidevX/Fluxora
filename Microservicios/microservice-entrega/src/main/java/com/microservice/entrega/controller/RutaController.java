package com.microservice.entrega.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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

    @GetMapping("/optimizada-ortools")
    public Map<String, Object> getOptimizedRouteORTools(@RequestParam Long driverId) {
        UsuarioDTO driver = usuarioServiceClient.getDriverById(driverId);
        List<ClienteDTO> clientes = clienteServiceClient.getAllClientes();
        List<ClienteDTO> orderedClients = rutaService.getOptimizedRouteORTools(clientes);
        Ruta origen = rutaService.getOrigenRuta();
        String osrmRoute = rutaService.getOsrmRoute(orderedClients, origen);

        Map<String, Object> result = new HashMap<>();
        result.put("orderedClients", orderedClients);
        result.put("osrmRoute", osrmRoute);
        return result;
    }

    @GetMapping("/clientes/{id_ruta}")
    public List<ClienteDTO> getClientesDeRuta(@PathVariable Long id_ruta) {
        return rutaService.getClientesDeRuta(id_ruta);
    }

    @GetMapping("/")
    public List<Ruta> getAllRutas() {
        return rutaService.getAllRutas();
    }
}
