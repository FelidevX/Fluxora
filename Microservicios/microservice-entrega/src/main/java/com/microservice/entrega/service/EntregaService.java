package com.microservice.entrega.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.microservice.entrega.client.ClienteServiceClient;
import com.microservice.entrega.dto.ClienteDTO;
import com.microservice.entrega.entity.ProgramacionEntrega;
import com.microservice.entrega.entity.RegistroEntrega;
import com.microservice.entrega.entity.Ruta;
import com.microservice.entrega.entity.RutaCliente;
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
    
    // Actualizar programación individual de un cliente específico  //
    public String actualizarProgramacionCliente(Long idRuta, Long idCliente, String fecha, Double kgCorriente, Double kgEspecial) {
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
            List<RutaCliente> programacionesExistentes = rutaClienteRepository.findByIdRutaAndFechaProgramada(idRuta, fechaProgramada);
            
            if (programacionesExistentes.isEmpty()) {
                // Primera vez que se programa para esta fecha - crear programaciones para todos los clientes
                List<RutaCliente> clientesBase = rutaClienteRepository.findByIdRuta(idRuta);
                
                for (RutaCliente clienteBase : clientesBase) {
                    // Solo procesar clientes base (sin fecha programada)
                    if (clienteBase.getFecha_programada() == null) {
                        RutaCliente nuevaProgramacion = new RutaCliente();
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
                        
                        rutaClienteRepository.save(nuevaProgramacion);
                    }
                }
                
                return "Programación creada exitosamente para toda la ruta. Cliente " + idCliente + " actualizado.";
            } else {
                // Ya existen programaciones - solo actualizar el cliente específico
                Optional<RutaCliente> rutaClienteOpt = rutaClienteRepository
                    .findByIdRutaAndIdClienteAndFechaProgramada(idRuta, idCliente, fechaProgramada);
                
                if (rutaClienteOpt.isPresent()) {
                    RutaCliente rutaCliente = rutaClienteOpt.get();
                    rutaCliente.setKg_corriente_programado(kgCorriente);
                    rutaCliente.setKg_especial_programado(kgEspecial);
                    rutaCliente.setEstado("PROGRAMADO");
                    rutaClienteRepository.save(rutaCliente);
                    
                    return "Programación actualizada exitosamente para el cliente " + idCliente;
                } else {
                    return "Error: No se encontró la programación para el cliente " + idCliente;
                }
            }
            
        } catch (Exception e) {
            return "Error al actualizar programación: " + e.getMessage();
        }
    }

    // Obtener programación del día anterior para preasignar valores, se podria mejorar, agregar un boton que llame a una funcion que llame a los datos de los clientes pasados
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
     * usando valores programados cuando existan o valores del día anterior/por defecto
     */ // Eliminar
    private List<Map<String, Object>> obtenerTodasLasRutasParaFecha(LocalDate fecha) {
        List<Ruta> todasLasRutas = rutaRepository.findAll();
        List<Map<String, Object>> resultado = new ArrayList<>();
        
        for (Ruta ruta : todasLasRutas) {
            // Primero buscar si hay programaciones para esta fecha específica
            List<RutaCliente> programacionesFecha = rutaClienteRepository.findByIdRutaAndFechaProgramada(ruta.getId(), fecha);
            
            Map<String, Object> rutaData = new HashMap<>();
            
            // Información de la ruta
            Map<String, Object> rutaInfo = new HashMap<>();
            rutaInfo.put("id", ruta.getId());
            rutaInfo.put("nombre", ruta.getNombre());
            rutaInfo.put("id_driver", ruta.getId_driver());
            rutaData.put("ruta", rutaInfo);
            rutaData.put("fecha", fecha.toString());
            
            List<Map<String, Object>> clientesData = new ArrayList<>();
            
            if (!programacionesFecha.isEmpty()) {
                // Si hay programaciones para esta fecha, usar solo esas
                for (RutaCliente programacion : programacionesFecha) {
                    Map<String, Object> clienteData = new HashMap<>();
                    
                    // Obtener información del cliente
                    try {
                        List<Long> clienteIds = List.of(programacion.getId_cliente());
                        List<ClienteDTO> clientes = clienteServiceClient.getClientesByIds(clienteIds);
                        if (!clientes.isEmpty()) {
                            clienteData.put("cliente", clientes.get(0));
                        } else {
                            // Cliente por defecto si no se encuentra
                            Map<String, Object> clienteDefault = new HashMap<>();
                            clienteDefault.put("id", programacion.getId_cliente());
                            clienteDefault.put("nombre", "Cliente " + programacion.getId_cliente());
                            clienteDefault.put("nombreNegocio", "Cliente " + programacion.getId_cliente());
                            clienteDefault.put("direccion", "Dirección no disponible");
                            clienteData.put("cliente", clienteDefault);
                        }
                    } catch (Exception e) {
                        System.out.println("Error al obtener cliente " + programacion.getId_cliente() + ": " + e.getMessage());
                        // Cliente por defecto
                        Map<String, Object> clienteDefault = new HashMap<>();
                        clienteDefault.put("id", programacion.getId_cliente());
                        clienteDefault.put("nombre", "Cliente " + programacion.getId_cliente());
                        clienteDefault.put("nombreNegocio", "Cliente " + programacion.getId_cliente());
                        clienteDefault.put("direccion", "Dirección no disponible");
                        clienteData.put("cliente", clienteDefault);
                    }
                    
                    // Usar los datos de la programación existente
                    Map<String, Object> rutaClienteInfo = new HashMap<>();
                    rutaClienteInfo.put("id", programacion.getId());
                    rutaClienteInfo.put("id_ruta", programacion.getId_ruta());
                    rutaClienteInfo.put("id_cliente", programacion.getId_cliente());
                    rutaClienteInfo.put("orden", programacion.getOrden());
                    rutaClienteInfo.put("kg_corriente_programado", 
                        programacion.getKg_corriente_programado() != null ? programacion.getKg_corriente_programado() : 0.0);
                    rutaClienteInfo.put("kg_especial_programado", 
                        programacion.getKg_especial_programado() != null ? programacion.getKg_especial_programado() : 0.0);
                    rutaClienteInfo.put("fecha_programada", fecha.toString());
                    rutaClienteInfo.put("estado", 
                        programacion.getEstado() != null ? programacion.getEstado() : "Programado");
                    
                    clienteData.put("rutaCliente", rutaClienteInfo);
                    clientesData.add(clienteData);
                }
            } else {
                // Si no hay programaciones para esta fecha, mostrar todos los clientes base con valores en 0
                List<RutaCliente> rutaClientes = rutaClienteRepository.findByIdRuta(ruta.getId());
                
                for (RutaCliente rutaCliente : rutaClientes) {
                    // Solo procesar si no tiene fecha programada (es un cliente base)
                    if (rutaCliente.getFecha_programada() == null) {
                        Map<String, Object> clienteData = new HashMap<>();
                        
                        // Obtener información del cliente
                        try {
                            List<Long> clienteIds = List.of(rutaCliente.getId_cliente());
                            List<ClienteDTO> clientes = clienteServiceClient.getClientesByIds(clienteIds);
                            if (!clientes.isEmpty()) {
                                clienteData.put("cliente", clientes.get(0));
                            } else {
                                // Cliente por defecto si no se encuentra
                                Map<String, Object> clienteDefault = new HashMap<>();
                                clienteDefault.put("id", rutaCliente.getId_cliente());
                                clienteDefault.put("nombre", "Cliente " + rutaCliente.getId_cliente());
                                clienteDefault.put("nombreNegocio", "Cliente " + rutaCliente.getId_cliente());
                                clienteDefault.put("direccion", "Dirección no disponible");
                                clienteData.put("cliente", clienteDefault);
                            }
                        } catch (Exception e) {
                            System.out.println("Error al obtener cliente " + rutaCliente.getId_cliente() + ": " + e.getMessage());
                            // Cliente por defecto
                            Map<String, Object> clienteDefault = new HashMap<>();
                            clienteDefault.put("id", rutaCliente.getId_cliente());
                            clienteDefault.put("nombre", "Cliente " + rutaCliente.getId_cliente());
                            clienteDefault.put("nombreNegocio", "Cliente " + rutaCliente.getId_cliente());
                            clienteDefault.put("direccion", "Dirección no disponible");
                            clienteData.put("cliente", clienteDefault);
                        }
                        
                        // Mostrar valores por defecto para esta fecha
                        Map<String, Object> rutaClienteInfo = new HashMap<>();
                        rutaClienteInfo.put("id", rutaCliente.getId());
                        rutaClienteInfo.put("id_ruta", rutaCliente.getId_ruta());
                        rutaClienteInfo.put("id_cliente", rutaCliente.getId_cliente());
                        rutaClienteInfo.put("orden", rutaCliente.getOrden());
                        rutaClienteInfo.put("fecha_programada", fecha.toString());
                        rutaClienteInfo.put("kg_corriente_programado", 0.0);
                        rutaClienteInfo.put("kg_especial_programado", 0.0);
                        rutaClienteInfo.put("estado", "Sin programar");
                        
                        clienteData.put("rutaCliente", rutaClienteInfo);
                        clientesData.add(clienteData);
                    }
                }
            }
            
            if (!clientesData.isEmpty()) {
                
                // Ordenar por orden
                clientesData.sort((a, b) -> {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> rutaClienteA = (Map<String, Object>) a.get("rutaCliente");
                    @SuppressWarnings("unchecked")
                    Map<String, Object> rutaClienteB = (Map<String, Object>) b.get("rutaCliente");
                    Integer ordenA = (Integer) rutaClienteA.get("orden");
                    Integer ordenB = (Integer) rutaClienteB.get("orden");
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
}