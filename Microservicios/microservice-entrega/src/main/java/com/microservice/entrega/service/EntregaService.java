package com.microservice.entrega.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;

import com.microservice.entrega.client.ClienteServiceClient;
import com.microservice.entrega.client.InventarioServiceClient;
import com.microservice.entrega.dto.ClienteDTO;
import com.microservice.entrega.entity.SesionReparto;
import com.microservice.entrega.entity.ProgramacionEntrega;
import com.microservice.entrega.entity.RegistroEntrega;
import com.microservice.entrega.entity.Ruta;
import com.microservice.entrega.entity.RutaCliente;
import com.microservice.entrega.repository.SesionRepartoRepository;
import com.microservice.entrega.repository.ProgramacionEntregaRepository;
import com.microservice.entrega.repository.RegistroEntregaRepository;
import com.microservice.entrega.repository.RutaClienteRepository;
import com.microservice.entrega.repository.RutaRepository;

@Service
public class EntregaService {

    @Autowired
    private RutaRepository rutaRepository;

    @Autowired
    private RutaClienteRepository rutaClienteRepository;

    @Autowired
    private ProgramacionEntregaRepository programacionEntregaRepository;

    @Autowired
    private RegistroEntregaRepository registroEntregaRepository;

    @Autowired
    private ClienteServiceClient clienteServiceClient;

    @Autowired
    private SesionRepartoRepository sesionRepartoRepository;

    @Autowired
    private InventarioServiceClient inventarioServiceClient;

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
        try {
            // Convertir formato de fecha si es necesario
            LocalDate fechaProgramada;
            if (fecha.contains("-") && fecha.length() == 10) {
                String[] partes = fecha.split("-");
                if (partes.length == 3 && partes[2].length() == 4) {
                    // Formato dd-MM-yyyy, convertir a yyyy-MM-dd
                    fechaProgramada = LocalDate.parse(partes[2] + "-" + partes[1] + "-" + partes[0]);
                } else {
                    // Formato yyyy-MM-dd
                    fechaProgramada = LocalDate.parse(fecha);
                }
            } else {
                fechaProgramada = LocalDate.parse(fecha);
            }

            // Verificar si ya existen programaciones para esta ruta y fecha
            List<ProgramacionEntrega> programacionesExistentes = programacionEntregaRepository.findByIdRutaAndFechaProgramada(idRuta,
                    fechaProgramada);

            if (programacionesExistentes.isEmpty()) {
                // Primera vez que se programa para esta fecha - crear programaciones para todos
                // los clientes
                List<ProgramacionEntrega> clientesBase = programacionEntregaRepository.findByIdRuta(idRuta);

                for (ProgramacionEntrega clienteBase : clientesBase) {
                    // Solo procesar clientes base (sin fecha programada)
                    if (clienteBase.getFecha_programada() == null) {
                        ProgramacionEntrega nuevaProgramacion = new ProgramacionEntrega();
                        nuevaProgramacion.setId_ruta(idRuta);
                        nuevaProgramacion.setId_cliente(clienteBase.getId_cliente());
                        nuevaProgramacion.setOrden(clienteBase.getOrden());
                        nuevaProgramacion.setFecha_programada(fechaProgramada);
                        nuevaProgramacion.setEstado("PROGRAMADO");

                        // Si es el cliente que se está editando, usar los valores proporcionados
                        if (clienteBase.getId_cliente().equals(idCliente)) {
                            nuevaProgramacion.setKg_corriente_programado(kgCorriente);
                            nuevaProgramacion.setKg_especial_programado(kgEspecial);
                        } else {
                            // Para los demás clientes, usar valores por defecto (0)
                            nuevaProgramacion.setKg_corriente_programado(0.0);
                            nuevaProgramacion.setKg_especial_programado(0.0);
                        }

                        programacionEntregaRepository.save(nuevaProgramacion);
                    }
                }

                return "Programación creada exitosamente para toda la ruta. Cliente " + idCliente + " actualizado.";
            } else {
                // Ya existen programaciones - solo actualizar el cliente específico
                List<ProgramacionEntrega> programacionClienteOpt = programacionEntregaRepository
                        .findByIdRutaAndIdClienteAndFechaProgramada(idRuta, idCliente, fechaProgramada);

                if (!programacionClienteOpt.isEmpty()) {
                    ProgramacionEntrega programacionCliente = programacionClienteOpt.get(0);
                    programacionCliente.setKg_corriente_programado(kgCorriente);
                    programacionCliente.setKg_especial_programado(kgEspecial);
                    programacionCliente.setEstado("PROGRAMADO");
                    programacionEntregaRepository.save(programacionCliente);

                    return "Programación actualizada exitosamente para el cliente " + idCliente;
                } else {
                    return "Error: No se encontró la programación para el cliente " + idCliente;
                }
            }

        } catch (Exception e) {
            return "Error al actualizar programación: " + e.getMessage();
        }
    }

    // Obtener programación del día anterior para preasignar valores, se podria
    // mejorar, agregar un boton que llame a una funcion que llame a los datos de
    // los clientes pasados
    public List<Map<String, Object>> obtenerProgramacionAnterior(Long idRuta, String fecha) {
        LocalDate fechaActual = LocalDate.parse(fecha);
        LocalDate fechaAnterior = fechaActual.minusDays(1);

        List<ProgramacionEntrega> programacionAnterior = programacionEntregaRepository
                .findByIdRutaAndFechaProgramada(idRuta, fechaAnterior);

        List<Map<String, Object>> resultado = new ArrayList<>();

        for (ProgramacionEntrega prog : programacionAnterior) {
            Map<String, Object> programacion = new HashMap<>();
            programacion.put("id_cliente", prog.getId_cliente());
            programacion.put("kg_corriente_programado", prog.getKg_corriente_programado());
            programacion.put("kg_especial_programado", prog.getKg_especial_programado());
            programacion.put("orden", prog.getOrden());

            // Obtener información del cliente
            try {
                List<Long> clienteIds = List.of(prog.getId_cliente());
                List<ClienteDTO> clientes = clienteServiceClient.getClientesByIds(clienteIds);
                if (!clientes.isEmpty()) {
                    programacion.put("cliente", clientes.get(0));
                }
            } catch (Exception e) {
                System.err.println("Error al obtener cliente " + prog.getId_cliente() + ": " + e.getMessage());
            }

            resultado.add(programacion);
        }

        return resultado;
    }

    // Métodos básicos necesarios
    public List<Map<String, Object>> getRutasActivas() {
        List<Ruta> rutas = rutaRepository.findAll();
        List<Map<String, Object>> rutasActivas = new ArrayList<>();

        for (Ruta ruta : rutas) {
            Map<String, Object> rutaInfo = new HashMap<>();
            rutaInfo.put("id", ruta.getId());
            rutaInfo.put("nombre", ruta.getNombre());
            rutaInfo.put("id_driver", ruta.getId_driver());

            // Por simplicidad, por ahora no calculamos entregas completadas ni progreso
            rutaInfo.put("entregasCompletadas", 0);
            rutaInfo.put("progreso", 0);

            rutasActivas.add(rutaInfo);
        }

        return rutasActivas;
    }

    public void registrarEntrega(RegistroEntrega registroEntrega) {
        registroEntregaRepository.save(registroEntrega);
    }

    public List<RegistroEntrega> getHistorialEntregasCliente(Long idCliente) {
        return registroEntregaRepository.findByIdCliente(idCliente);
    }

    public void asignarDriverARuta(Long idRuta, Long idDriver) {
        Ruta ruta = rutaRepository.findById(idRuta)
                .orElseThrow(() -> new RuntimeException("Ruta no encontrada"));

        ruta.setId_driver(idDriver);
        rutaRepository.save(ruta);
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

                clienteData.put("rutaCliente", rutaClienteInfo);

                // Lista de productos programados
                List<Map<String, Object>> productosList = new ArrayList<>();
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
                        System.out.println("loteInfo: " + loteInfo);
                        Long idProducto = Long.valueOf(loteInfo.get("productoId").toString());
                        prodMap.put("id_producto", idProducto);

                        // 2. Obtener el producto
                        ResponseEntity<?> responseProducto = inventarioServiceClient.getProductoById(idProducto);
                        Map<String, Object> productoInfo = null;
                        if (responseProducto.getStatusCode().is2xxSuccessful() && responseProducto.getBody() instanceof Map) {
                            productoInfo = (Map<String, Object>) responseProducto.getBody();
                        }
                        if (productoInfo != null && productoInfo.containsKey("tipoProducto")) {
                            prodMap.put("tipoProducto", productoInfo.get("tipoProducto"));
                        }
                    }

                    productosList.add(prodMap);
                }
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
        try {
            String nombre = (String) datosRuta.get("nombre");
            String descripcion = (String) datosRuta.get("descripcion");
            String origenCoordenada = (String) datosRuta.get("origen_coordenada");
            Object idDriverObj = datosRuta.get("id_driver");

            if (nombre == null || nombre.trim().isEmpty()) {
                throw new IllegalArgumentException("El nombre de la ruta es obligatorio");
            }

            // Verificar si ya existe una ruta con el mismo nombre
            List<Ruta> rutasExistentes = rutaRepository.findAll();
            for (Ruta ruta : rutasExistentes) {
                if (ruta.getNombre().equalsIgnoreCase(nombre.trim())) {
                    throw new IllegalArgumentException("Ya existe una ruta con el nombre: " + nombre);
                }
            }

            Ruta nuevaRuta = new Ruta();
            nuevaRuta.setNombre(nombre.trim());

            // Parsear coordenadas si se proporcionan (formato "latitud,longitud")
            if (origenCoordenada != null && !origenCoordenada.trim().isEmpty()) {
                try {
                    String[] coords = origenCoordenada.trim().split(",");
                    if (coords.length == 2) {
                        nuevaRuta.setLatitud(Double.parseDouble(coords[0].trim()));
                        nuevaRuta.setLongitud(Double.parseDouble(coords[1].trim()));
                    }
                } catch (NumberFormatException e) {
                    // Si no se pueden parsear las coordenadas, continuar sin ellas
                    System.out.println("Advertencia: No se pudieron parsear las coordenadas: " + origenCoordenada);
                }
            }

            // Manejar el ID del driver (puede ser null)
            if (idDriverObj != null && !idDriverObj.toString().trim().isEmpty()) {
                try {
                    Long idDriver = Long.valueOf(idDriverObj.toString());
                    nuevaRuta.setId_driver(idDriver);
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("El ID del driver debe ser un número válido");
                }
            }

            Ruta rutaGuardada = rutaRepository.save(nuevaRuta);

            return "Ruta '" + rutaGuardada.getNombre() + "' creada exitosamente con ID: " + rutaGuardada.getId();

        } catch (Exception e) {
            throw new RuntimeException("Error al crear la ruta: " + e.getMessage(), e);
        }
    }

    public List<RegistroEntrega> getEntregasByIdPedido(Long idPedido) {
        try {
            return registroEntregaRepository.findByIdPedido(idPedido);
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener entregas por idPedido: " + e.getMessage(), e);
        }
    }

    public List<SesionReparto> getPedidos() {
        return sesionRepartoRepository.findAll();
    }

    public String programarEntrega(Long idRuta, Long idCliente, LocalDate fechaProgramacion, List<Map<String, Object>> productos) {
        try {
            for (Map<String, Object> prod : productos) {
                Long idProducto = Long.valueOf(prod.get("id_producto").toString());
                Long idLote = Long.valueOf(prod.get("id_lote").toString());
                Integer cantidad = Integer.valueOf(prod.get("cantidad_kg").toString());
                String nombreProducto = prod.get("nombreProducto").toString();

                ProgramacionEntrega programacion = new ProgramacionEntrega();
                programacion.setId_ruta(idRuta);
                programacion.setId_cliente(idCliente);
                programacion.setId_lote(idLote);
                programacion.setCantidadProducto(cantidad);
                programacion.setNombreProducto(nombreProducto);
                programacion.setFecha_programada(fechaProgramacion);

                programacionEntregaRepository.save(programacion);

                
                Map<String, Object> datosDescuento = new HashMap<>();
                datosDescuento.put("descontarCantidad", cantidad);
                System.out.println(datosDescuento.get("descontarCantidad"));


                ResponseEntity<?> response = inventarioServiceClient.descontarInventario(idProducto, datosDescuento);
                if (!response.getStatusCode().is2xxSuccessful()) {
                    throw new RuntimeException("Error al descontar inventario para producto ID: " + idProducto);
                }
            }
            return "Entrega programada exitosamente";
        } catch (Exception e) {
            throw new RuntimeException("Error al programar entrega diaria: " + e.getMessage(), e);
        }
    }
}