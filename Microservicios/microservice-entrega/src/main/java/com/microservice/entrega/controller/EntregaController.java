package com.microservice.entrega.controller;

import java.time.LocalDate;
import java.util.HashMap;
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
import com.microservice.entrega.dto.RegistroEntregaDTO;
import com.microservice.entrega.entity.SesionReparto;
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
    public ResponseEntity<Map<String, Object>> registrarEntrega(@RequestBody RegistroEntregaDTO registroEntregaDTO) {
        try {
            if (registroEntregaDTO.getId_pedido() == null) {
                System.err.println("ERROR: id_pedido es NULL");
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "El id_pedido es obligatorio");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            if (registroEntregaDTO.getProductos() == null || registroEntregaDTO.getProductos().isEmpty()) {
                System.err.println("ERROR: No se enviaron productos");
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Debe incluir al menos un producto");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            entregaService.registrarEntrega(registroEntregaDTO);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Entrega registrada exitosamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error al registrar entrega: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error al registrar entrega: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
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

    // Actualizar programación individual de un cliente
    @PostMapping("/actualizar-programacion-cliente")
    public ResponseEntity<String> actualizarProgramacionCliente(@RequestBody Map<String, Object> datos) {
        try {
            Long idRuta = Long.valueOf(datos.get("idRuta").toString());
            Long idCliente = Long.valueOf(datos.get("idCliente").toString());
            String fecha = datos.get("fecha").toString();
            Double kgCorriente = Double.valueOf(datos.get("kgCorriente").toString());
            Double kgEspecial = Double.valueOf(datos.get("kgEspecial").toString());

            String mensaje = entregaService.actualizarProgramacionCliente(idRuta, idCliente, fecha, kgCorriente,
                    kgEspecial);
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

    @GetMapping("/pedido/{idPedido}")
    public ResponseEntity<List<RegistroEntrega>> getEntregasByIdPedido(@PathVariable Long idPedido) {
        try {
            List<RegistroEntrega> entregas = entregaService.getEntregasByIdPedido(idPedido);
            return ResponseEntity.ok(entregas);
        } catch (Exception e) {
            System.err.println("Error al obtener entregas por idPedido: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/pedidos")
    public ResponseEntity<List<SesionReparto>> obtenerPedidos() {
        try {
            List<SesionReparto> pedido = entregaService.getPedidos();
            return ResponseEntity.ok(pedido);
        } catch (Exception e) {
            System.err.println("Error al obtener pedidos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/programar-entrega")
    public ResponseEntity<String> programarEntrega(@RequestBody Map<String, Object> datosProgramacion) {
        try {
            System.out.println("Datos de programación recibidos: " + datosProgramacion);
            Long idRuta = Long.valueOf(datosProgramacion.get("idRuta").toString());
            Long idCliente = Long.valueOf(datosProgramacion.get("idCliente").toString());
            LocalDate fechaProgramacion = LocalDate.parse(datosProgramacion.get("fechaProgramacion").toString());
            List<Map<String, Object>> productos = (List<Map<String, Object>>) datosProgramacion.get("productos");
            entregaService.programarEntrega(idRuta, idCliente, fechaProgramacion, productos);
            return ResponseEntity.ok("Entrega programada exitosamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al programar entrega: " + e.getMessage());
        }
    }
}
