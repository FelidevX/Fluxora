package com.microservice.entrega.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.microservice.entrega.client.ClienteServiceClient;
import com.microservice.entrega.client.InventarioServiceClient;
import com.microservice.entrega.client.UsuarioServiceClient;
import com.microservice.entrega.dto.ClienteDTO;
import com.microservice.entrega.dto.UsuarioDTO;
import com.microservice.entrega.dto.RegistroEntregaDTO;
import com.microservice.entrega.entity.SesionReparto;
import com.microservice.entrega.entity.ProgramacionEntrega;
import com.microservice.entrega.entity.RegistroEntrega;
import com.microservice.entrega.entity.Ruta;
import com.microservice.entrega.entity.RutaCliente;
import com.microservice.entrega.repository.ProgramacionEntregaRepository;
import com.microservice.entrega.repository.RutaClienteRepository;
import com.microservice.entrega.repository.RutaRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EntregaService {

    private final RutaRepository rutaRepository;
    private final RutaClienteRepository rutaClienteRepository;
    private final ProgramacionEntregaRepository programacionEntregaRepository;
    private final ClienteServiceClient clienteServiceClient;
    private final InventarioServiceClient inventarioServiceClient;
    private final UsuarioServiceClient usuarioServiceClient;
    
    // Servicios delegados
    private final RutaService rutaService;
    private final ProgramacionService programacionService;
    private final RegistroEntregaService registroEntregaService;
    private final ReporteService reporteService;

    // Obtener rutas programadas por fecha
    public List<Map<String, Object>> getRutasProgramadasPorFecha(String fecha) {
        // Convertir formato dd-MM-yyyy a yyyy-MM-dd para LocalDate
        LocalDate fechaBusqueda;
        if (fecha.contains("-") && fecha.length() == 10) {
            String[] partes = fecha.split("-");
            if (partes.length == 3 && partes[2].length() == 4) {
                fechaBusqueda = LocalDate.parse(partes[2] + "-" + partes[1] + "-" + partes[0]);
            } else {
                fechaBusqueda = LocalDate.parse(fecha);
            }
        } else {
            fechaBusqueda = LocalDate.parse(fecha);
        }
        return obtenerTodasLasRutasParaFecha(fechaBusqueda);
    }

    // Actualizar programación individual de un cliente específico //
    public String actualizarProgramacionCliente(Long idRuta, Long idCliente, String fecha, Double kgCorriente,
            Double kgEspecial) {
        return programacionService.actualizarProgramacionCliente(idRuta, idCliente, fecha, kgCorriente, kgEspecial);
    }

    // Obtener programación del día anterior para preasignar valores
    public List<Map<String, Object>> obtenerProgramacionAnterior(Long idRuta, String fecha) {
        return programacionService.obtenerProgramacionAnterior(idRuta, fecha);
    }

    // Métodos básicos necesarios
    public List<Map<String, Object>> getRutasActivas() {
        return rutaService.getRutasActivas();
    }

    public void registrarEntrega(RegistroEntregaDTO dto) {
        registroEntregaService.registrarEntrega(dto);
    }

    public List<RegistroEntrega> getHistorialEntregasCliente(Long idCliente) {
        return registroEntregaService.getHistorialEntregasCliente(idCliente);
    }

    public void asignarDriverARuta(Long idRuta, Long idDriver) {
        rutaService.asignarDriverARuta(idRuta, idDriver);
    }

    /**
     * Obtiene todas las rutas disponibles para una fecha específica,
     * usando valores programados cuando existan o valores del día anterior/por
     * defecto
     */ // Eliminar
    private List<Map<String, Object>> obtenerTodasLasRutasParaFecha(LocalDate fecha) {
        List<Ruta> todasLasRutas = rutaRepository.findAll();
        List<Map<String, Object>> resultado = new ArrayList<>();

        for (Ruta ruta : todasLasRutas) {
            // Obtener todas las programaciones para la ruta y fecha
            List<ProgramacionEntrega> programacionesFecha = programacionEntregaRepository.findByIdRutaAndFechaProgramada(ruta.getId(), fecha);

            Map<String, Object> rutaData = new HashMap<>();
            Map<String, Object> rutaInfo = new HashMap<>();
            rutaInfo.put("id", ruta.getId());
            rutaInfo.put("nombre", ruta.getNombre());
            rutaInfo.put("id_driver", ruta.getId_driver());
            
            // Obtener nombre del driver si está asignado
            if (ruta.getId_driver() != null) {
                try {
                    UsuarioDTO driver = usuarioServiceClient.getDriverById(ruta.getId_driver());
                    rutaInfo.put("nombreDriver", driver.getNombre());
                } catch (Exception e) {
                    rutaInfo.put("nombreDriver", null);
                }
            } else {
                rutaInfo.put("nombreDriver", null);
            }
            
            rutaData.put("ruta", rutaInfo);
            rutaData.put("fecha", fecha.toString());

            List<Map<String, Object>> clientesData = new ArrayList<>();

            // Agrupa programaciones por cliente
            Map<Long, List<ProgramacionEntrega>> programacionesPorCliente = new HashMap<>();
            for (ProgramacionEntrega prog : programacionesFecha) {
                programacionesPorCliente
                    .computeIfAbsent(prog.getId_cliente(), k -> new ArrayList<>())
                    .add(prog);
            }

            // Obtener todos los clientes de la ruta
            List<Long> clientesDeLaRuta = rutaClienteRepository.findByIdRuta(ruta.getId())
                .stream()
                .map(RutaCliente::getId_cliente)
                .toList();

            for (Long idCliente : clientesDeLaRuta) {
                Map<String, Object> clienteData = new HashMap<>();

                // Obtener información del cliente
                try {
                    List<Long> clienteIds = List.of(idCliente);
                    List<ClienteDTO> clientes = clienteServiceClient.getClientesByIds(clienteIds);
                    
                    if (!clientes.isEmpty()) {
                        clienteData.put("cliente", clientes.get(0));
                    } else {
                        Map<String, Object> clienteDefault = new HashMap<>();
                        clienteDefault.put("id", idCliente);
                        clienteDefault.put("nombre", "Cliente " + idCliente);
                        clienteDefault.put("nombreNegocio", "Cliente " + idCliente);
                        clienteDefault.put("direccion", "Dirección no disponible");
                        clienteData.put("cliente", clienteDefault);
                    }
                } catch (Exception e) {
                    Map<String, Object> clienteDefault = new HashMap<>();
                    clienteDefault.put("id", idCliente);
                    clienteDefault.put("nombre", "Cliente " + idCliente);
                    clienteDefault.put("nombreNegocio", "Cliente " + idCliente);
                    clienteDefault.put("direccion", "Dirección no disponible");
                    clienteData.put("cliente", clienteDefault);
                }

                // Programaciones para este cliente en la fecha
                List<ProgramacionEntrega> productosProgramados = programacionesPorCliente.getOrDefault(idCliente, new ArrayList<>());

                // Info de ruta para el cliente
                Map<String, Object> rutaClienteInfo = new HashMap<>();
                rutaClienteInfo.put("id_ruta", ruta.getId());
                rutaClienteInfo.put("id_cliente", idCliente);
                rutaClienteInfo.put("fecha_programada", fecha.toString());
                rutaClienteInfo.put("estado", productosProgramados.isEmpty() ? "Sin programar" : productosProgramados.get(0).getEstado());

                // Si tienes campo orden en RutaCliente, puedes obtenerlo así:
                Optional<ProgramacionEntrega> rutaClienteOpt = programacionEntregaRepository.findByIdRuta(ruta.getId())
                    .stream()
                    .filter(rc -> rc.getId_cliente().equals(idCliente))
                    .findFirst();
                rutaClienteInfo.put("orden", rutaClienteOpt.map(ProgramacionEntrega::getOrden).orElse(0));

                // Lista de productos programados
                List<Map<String, Object>> productosList = new ArrayList<>();
                double kgCorrienteTotal = 0.0;
                double kgEspecialTotal = 0.0;
                
                for (ProgramacionEntrega prod : productosProgramados) {
                    Map<String, Object> prodMap = new HashMap<>();
                    
                    prodMap.put("id_lote", prod.getId_lote());
                    prodMap.put("nombreProducto", prod.getNombreProducto());
                    prodMap.put("cantidad_kg", prod.getCantidadProducto());
                    prodMap.put("estado", prod.getEstado());

                    // 1. Obtener el lote
                    ResponseEntity<?> responseLote = inventarioServiceClient.getLoteById(prod.getId_lote());
                    Map<String, Object> loteInfo = null;
                    if (responseLote.getStatusCode().is2xxSuccessful() && responseLote.getBody() instanceof Map) {
                        loteInfo = (Map<String, Object>) responseLote.getBody();
                    }
                    if (loteInfo != null && loteInfo.containsKey("productoId")) {
                        Long idProducto = Long.valueOf(loteInfo.get("productoId").toString());
                        prodMap.put("id_producto", idProducto);

                        // 2. Obtener el producto
                        ResponseEntity<?> responseProducto = inventarioServiceClient.getProductoById(idProducto);
                        Map<String, Object> productoInfo = null;
                        if (responseProducto.getStatusCode().is2xxSuccessful() && responseProducto.getBody() instanceof Map) {
                            productoInfo = (Map<String, Object>) responseProducto.getBody();
                        }
                        if (productoInfo != null && productoInfo.containsKey("tipoProducto")) {
                            String tipoProducto = (String) productoInfo.get("tipoProducto");
                            prodMap.put("tipoProducto", tipoProducto);
                            
                            // Sumar kg según el tipo de producto
                            Integer cantidadKgInt = prod.getCantidadProducto();
                            if (cantidadKgInt != null) {
                                double cantidadKg = cantidadKgInt.doubleValue();
                                if ("CORRIENTE".equalsIgnoreCase(tipoProducto)) {
                                    kgCorrienteTotal += cantidadKg;
                                } else if ("ESPECIAL".equalsIgnoreCase(tipoProducto)) {
                                    kgEspecialTotal += cantidadKg;
                                }
                            }
                        }
                    }

                    productosList.add(prodMap);
                }
                
                // Agregar los totales calculados a rutaClienteInfo
                rutaClienteInfo.put("kg_corriente_programado", kgCorrienteTotal);
                rutaClienteInfo.put("kg_especial_programado", kgEspecialTotal);
                
                clienteData.put("rutaCliente", rutaClienteInfo);
                clienteData.put("productosProgramados", productosList);

                clientesData.add(clienteData);
            }

            // Ordenar por orden
            clientesData.sort((a, b) -> {
                @SuppressWarnings("unchecked")
                Map<String, Object> rutaClienteA = (Map<String, Object>) a.get("rutaCliente");
                @SuppressWarnings("unchecked")
                Map<String, Object> rutaClienteB = (Map<String, Object>) b.get("rutaCliente");
                Integer ordenA = (Integer) rutaClienteA.get("orden");
                Integer ordenB = (Integer) rutaClienteB.get("orden");
                if (ordenA == null) ordenA = 0;
                if (ordenB == null) ordenB = 0;
                return ordenA.compareTo(ordenB);
            });

            rutaData.put("clientes", clientesData);
            rutaData.put("totalClientes", clientesData.size());

            // Calcular totales
            double totalCorriente = 0.0;
            double totalEspecial = 0.0;
            for (Map<String, Object> clienteData : clientesData) {
                @SuppressWarnings("unchecked")
                Map<String, Object> rutaCliente = (Map<String, Object>) clienteData.get("rutaCliente");
                Double kgCorriente = (Double) rutaCliente.get("kg_corriente_programado");
                Double kgEspecial = (Double) rutaCliente.get("kg_especial_programado");
                totalCorriente += (kgCorriente != null ? kgCorriente : 0.0);
                totalEspecial += (kgEspecial != null ? kgEspecial : 0.0);
            }
            rutaData.put("totalKgCorriente", totalCorriente);
            rutaData.put("totalKgEspecial", totalEspecial);

            resultado.add(rutaData);
        }

        return resultado;
    }

    /**
     * Crear nueva ruta con los datos proporcionados
     */
    public String crearRuta(Map<String, Object> datosRuta) {
        return rutaService.crearRuta(datosRuta);
    }

    public List<RegistroEntrega> getEntregasByIdPedido(Long idPedido) {
        return registroEntregaService.getEntregasByIdPedido(idPedido);
    }

    public List<SesionReparto> getPedidos() {
        return registroEntregaService.getPedidos();
    }

    @org.springframework.transaction.annotation.Transactional
    public String programarEntrega(Long idRuta, Long idCliente, LocalDate fechaProgramacion, List<Map<String, Object>> productos) {
        return programacionService.programarEntrega(idRuta, idCliente, fechaProgramacion, productos);
    }

    public List<ProgramacionEntrega> getProgramacionPorRutaYFecha(Long idRuta, LocalDate fecha) {
        return programacionService.getProgramacionPorRutaYFecha(idRuta, fecha);
    }

    @org.springframework.transaction.annotation.Transactional
    public void eliminarRelacionesCliente(Long idCliente) {
        registroEntregaService.eliminarRelacionesCliente(idCliente);
    }

    /**
     * Obtener estadísticas para el dashboard
     */
    public Map<String, Object> obtenerEstadisticasDashboard() {
        return reporteService.obtenerEstadisticasDashboard();
    }

    /**
     * Generar reporte de entregas por periodo
     */
    public Map<String, Object> generarReporteEntregas(LocalDate fechaInicio, LocalDate fechaFin, Long idRuta) {
        return reporteService.generarReporteEntregas(fechaInicio, fechaFin, idRuta);
    }

    /**
     * Generar reporte de ventas por periodo
     */
    public Map<String, Object> generarReporteVentas(LocalDate fechaInicio, LocalDate fechaFin) {
        return reporteService.generarReporteVentas(fechaInicio, fechaFin);
    }

    /**
     * Eliminar una ruta y todas sus relaciones
     */
    public void eliminarRuta(Long idRuta) {
        rutaService.eliminarRuta(idRuta);
    }

    /**
     * Obtener plan de producción para una fecha específica
     */
    public Map<String, Object> getPlanProduccion(LocalDate fecha) {
        return reporteService.getPlanProduccion(fecha);
    }
}
