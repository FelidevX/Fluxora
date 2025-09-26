package com.microservice.entrega.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
                // Formato dd-MM-yyyy, convertir a yyyy-MM-dd
                fechaBusqueda = LocalDate.parse(partes[2] + "-" + partes[1] + "-" + partes[0]);
            } else {
                // Formato yyyy-MM-dd
                fechaBusqueda = LocalDate.parse(fecha);
            }
        } else {
            fechaBusqueda = LocalDate.parse(fecha);
        }
        
        // SIEMPRE obtener todas las rutas con sus clientes
        // Siempre mostrar todas las rutas disponibles para la fecha
        return obtenerTodasLasRutasParaFecha(fechaBusqueda);
    }
    
    // Programar entregas individuales para cada cliente de una ruta
    public void programarEntregasIndividuales(Long idRuta, String fecha, List<Map<String, Object>> entregas) {
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
        
        // Eliminar programaciones existentes para esta ruta y fecha
        List<ProgramacionEntrega> existentes = programacionEntregaRepository.findByIdRutaAndFechaProgramada(idRuta, fechaProgramada);
        programacionEntregaRepository.deleteAll(existentes);
        
        // Crear nuevas programaciones
        for (int i = 0; i < entregas.size(); i++) {
            Map<String, Object> entregaData = entregas.get(i);
            
            ProgramacionEntrega programacion = new ProgramacionEntrega();
            programacion.setId_ruta(idRuta);
            programacion.setId_cliente(Long.valueOf(entregaData.get("idCliente").toString()));
            programacion.setFecha_programada(fechaProgramada);
            programacion.setKg_corriente_programado(
                entregaData.get("kgCorriente") != null ? 
                Double.valueOf(entregaData.get("kgCorriente").toString()) : 0.0
            );
            programacion.setKg_especial_programado(
                entregaData.get("kgEspecial") != null ? 
                Double.valueOf(entregaData.get("kgEspecial").toString()) : 0.0
            );
            programacion.setOrden(i + 1);
            
            programacionEntregaRepository.save(programacion);
        }
    }

    // Obtener programación del día anterior para preasignar valores
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

    // Programar ruta completa copiando del día anterior
    public void programarRutaCompletaPorFecha(Long idRuta, String fecha, List<Map<String, Object>> clientesProgramacion) {
        LocalDate fechaProgramada = LocalDate.parse(fecha);
        
        // Si no se proporcionan clientes, copiar del día anterior
        if (clientesProgramacion == null || clientesProgramacion.isEmpty()) {
            LocalDate fechaAnterior = fechaProgramada.minusDays(1);
            List<ProgramacionEntrega> programacionAnterior = programacionEntregaRepository
                .findByIdRutaAndFechaProgramada(idRuta, fechaAnterior);
            
            for (ProgramacionEntrega progAnterior : programacionAnterior) {
                // Verificar si ya existe programación para este día
                ProgramacionEntrega existente = programacionEntregaRepository
                    .findByIdRutaAndIdClienteAndFechaProgramada(idRuta, progAnterior.getId_cliente(), fechaProgramada);
                
                if (existente == null) {
                    // Crear nueva programación copiando del día anterior
                    ProgramacionEntrega nuevaProg = new ProgramacionEntrega();
                    nuevaProg.setId_ruta(idRuta);
                    nuevaProg.setId_cliente(progAnterior.getId_cliente());
                    nuevaProg.setKg_corriente_programado(progAnterior.getKg_corriente_programado());
                    nuevaProg.setKg_especial_programado(progAnterior.getKg_especial_programado());
                    nuevaProg.setOrden(progAnterior.getOrden());
                    nuevaProg.setFecha_programada(fechaProgramada);
                    programacionEntregaRepository.save(nuevaProg);
                }
            }
        } else {
            // Usar la programación proporcionada
            programarEntregasIndividuales(idRuta, fecha, clientesProgramacion);
        }
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

            // Obtener clientes de la ruta
            List<RutaCliente> rutaClientes = rutaClienteRepository.findByIdRuta(ruta.getId());
            List<Long> clienteIds = rutaClientes.stream()
                .map(RutaCliente::getId_cliente)
                .toList();

            if (!clienteIds.isEmpty()) {
                try {
                    List<ClienteDTO> clientes = clienteServiceClient.getClientesByIds(clienteIds);
                    rutaInfo.put("clientes", clientes);
                    rutaInfo.put("totalClientes", clientes.size());
                } catch (Exception e) {
                    System.err.println("Error al obtener clientes para ruta " + ruta.getId() + ": " + e.getMessage());
                    rutaInfo.put("clientes", new ArrayList<>());
                    rutaInfo.put("totalClientes", 0);
                }
            } else {
                rutaInfo.put("clientes", new ArrayList<>());
                rutaInfo.put("totalClientes", 0);
            }

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

    public void crearDatosPrueba() {
        // Crear rutas de prueba
        Ruta ruta1 = new Ruta();
        ruta1.setNombre("Ruta Centro");
        ruta1.setLatitud(-12.0464);
        ruta1.setLongitud(-77.0428);
        ruta1.setId_driver(1L);
        rutaRepository.save(ruta1);

        Ruta ruta2 = new Ruta();
        ruta2.setNombre("Ruta Norte");
        ruta2.setLatitud(-12.0200);
        ruta2.setLongitud(-77.0500);
        ruta2.setId_driver(2L);
        rutaRepository.save(ruta2);

        // Crear asignaciones básicas de clientes a rutas
        RutaCliente rc1 = new RutaCliente();
        rc1.setId_ruta(ruta1.getId());
        rc1.setId_cliente(1L);
        rc1.setOrden(1);
        rutaClienteRepository.save(rc1);

        RutaCliente rc2 = new RutaCliente();
        rc2.setId_ruta(ruta1.getId());
        rc2.setId_cliente(2L);
        rc2.setOrden(2);
        rutaClienteRepository.save(rc2);

        RutaCliente rc3 = new RutaCliente();
        rc3.setId_ruta(ruta2.getId());
        rc3.setId_cliente(3L);
        rc3.setOrden(1);
        rutaClienteRepository.save(rc3);

        // Crear programaciones de prueba
        ProgramacionEntrega prog1 = new ProgramacionEntrega();
        prog1.setId_ruta(ruta1.getId());
        prog1.setId_cliente(1L);
        prog1.setKg_corriente_programado(15.0);
        prog1.setKg_especial_programado(8.0);
        prog1.setFecha_programada(LocalDate.now());
        prog1.setOrden(1);
        programacionEntregaRepository.save(prog1);

        ProgramacionEntrega prog2 = new ProgramacionEntrega();
        prog2.setId_ruta(ruta1.getId());
        prog2.setId_cliente(2L);
        prog2.setKg_corriente_programado(12.0);
        prog2.setKg_especial_programado(6.0);
        prog2.setFecha_programada(LocalDate.now());
        prog2.setOrden(2);
        programacionEntregaRepository.save(prog2);

        ProgramacionEntrega prog3 = new ProgramacionEntrega();
        prog3.setId_ruta(ruta2.getId());
        prog3.setId_cliente(3L);
        prog3.setKg_corriente_programado(20.0);
        prog3.setKg_especial_programado(10.0);
        prog3.setFecha_programada(LocalDate.now().plusDays(1));
        prog3.setOrden(1);
        programacionEntregaRepository.save(prog3);

        // Crear programación del día anterior para testing
        ProgramacionEntrega progAyer1 = new ProgramacionEntrega();
        progAyer1.setId_ruta(ruta1.getId());
        progAyer1.setId_cliente(1L);
        progAyer1.setKg_corriente_programado(18.0);
        progAyer1.setKg_especial_programado(9.0);
        progAyer1.setFecha_programada(LocalDate.now().minusDays(1));
        progAyer1.setOrden(1);
        programacionEntregaRepository.save(progAyer1);

        ProgramacionEntrega progAyer2 = new ProgramacionEntrega();
        progAyer2.setId_ruta(ruta1.getId());
        progAyer2.setId_cliente(2L);
        progAyer2.setKg_corriente_programado(14.0);
        progAyer2.setKg_especial_programado(7.0);
        progAyer2.setFecha_programada(LocalDate.now().minusDays(1));
        progAyer2.setOrden(2);
        programacionEntregaRepository.save(progAyer2);
    }

    // Método para obtener rutas con clientes cuando no hay programación
    private List<Map<String, Object>> obtenerRutasConClientesSinProgramacion(LocalDate fecha) {
        List<Ruta> todasLasRutas = rutaRepository.findAll();
        List<Map<String, Object>> resultado = new ArrayList<>();
        
        for (Ruta ruta : todasLasRutas) {
            List<RutaCliente> rutaClientes = rutaClienteRepository.findByIdRuta(ruta.getId());
            
            if (!rutaClientes.isEmpty()) {
                Map<String, Object> rutaData = new HashMap<>();
                
                // Información de la ruta
                Map<String, Object> rutaInfo = new HashMap<>();
                rutaInfo.put("id", ruta.getId());
                rutaInfo.put("nombre", ruta.getNombre());
                rutaInfo.put("id_driver", ruta.getId_driver());
                rutaData.put("ruta", rutaInfo);
                rutaData.put("fecha", fecha.toString());
                
                List<Map<String, Object>> clientesData = new ArrayList<>();
                
                for (RutaCliente rutaCliente : rutaClientes) {
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
                    
                    // Obtener programación del día anterior si existe
                    LocalDate fechaAnterior = fecha.minusDays(1);
                    ProgramacionEntrega progAnterior = programacionEntregaRepository
                        .findByIdRutaAndIdClienteAndFechaProgramada(ruta.getId(), rutaCliente.getId_cliente(), fechaAnterior);
                    
                    Map<String, Object> rutaClienteInfo = new HashMap<>();
                    rutaClienteInfo.put("id", rutaCliente.getId());
                    rutaClienteInfo.put("id_ruta", rutaCliente.getId_ruta());
                    rutaClienteInfo.put("id_cliente", rutaCliente.getId_cliente());
                    rutaClienteInfo.put("orden", rutaCliente.getOrden());
                    rutaClienteInfo.put("fecha_programada", fecha.toString());
                    
                    // Usar valores del día anterior si existen, sino valores por defecto
                    if (progAnterior != null) {
                        rutaClienteInfo.put("kg_corriente_programado", progAnterior.getKg_corriente_programado());
                        rutaClienteInfo.put("kg_especial_programado", progAnterior.getKg_especial_programado());
                    } else {
                        rutaClienteInfo.put("kg_corriente_programado", 10.0); // Valor por defecto
                        rutaClienteInfo.put("kg_especial_programado", 5.0);   // Valor por defecto
                    }
                    
                    clienteData.put("rutaCliente", rutaClienteInfo);
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
     * Obtiene todas las rutas disponibles para una fecha específica,
     * usando valores programados cuando existan o valores del día anterior/por defecto
     */
    private List<Map<String, Object>> obtenerTodasLasRutasParaFecha(LocalDate fecha) {
        // Obtener todas las rutas disponibles  
        List<Ruta> todasLasRutas = rutaRepository.findAll();
        List<Map<String, Object>> resultado = new ArrayList<>();
        
        // Obtener todas las programaciones existentes para esta fecha
        List<ProgramacionEntrega> programacionesExistentes = programacionEntregaRepository.findByFechaProgramada(fecha);
        Map<String, ProgramacionEntrega> mapaProgramaciones = new HashMap<>();
        
        // Crear un mapa para acceso rápido: "idRuta-idCliente" -> ProgramacionEntrega
        for (ProgramacionEntrega prog : programacionesExistentes) {
            String clave = prog.getId_ruta() + "-" + prog.getId_cliente();
            mapaProgramaciones.put(clave, prog);
        }
        
        for (Ruta ruta : todasLasRutas) {
            List<RutaCliente> rutaClientes = rutaClienteRepository.findByIdRuta(ruta.getId());
            
            if (!rutaClientes.isEmpty()) {
                Map<String, Object> rutaData = new HashMap<>();
                
                // Información de la ruta
                Map<String, Object> rutaInfo = new HashMap<>();
                rutaInfo.put("id", ruta.getId());
                rutaInfo.put("nombre", ruta.getNombre());
                rutaInfo.put("id_driver", ruta.getId_driver());
                rutaData.put("ruta", rutaInfo);
                rutaData.put("fecha", fecha.toString());
                
                List<Map<String, Object>> clientesData = new ArrayList<>();
                
                for (RutaCliente rutaCliente : rutaClientes) {
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
                    
                    // Buscar programación existente para este cliente y ruta
                    String claveProgramacion = ruta.getId() + "-" + rutaCliente.getId_cliente();
                    ProgramacionEntrega programacionExistente = mapaProgramaciones.get(claveProgramacion);
                    
                    Map<String, Object> rutaClienteInfo = new HashMap<>();
                    
                    if (programacionExistente != null) {
                        // Usar valores de la programación existente
                        rutaClienteInfo.put("id", programacionExistente.getId());
                        rutaClienteInfo.put("id_ruta", programacionExistente.getId_ruta());
                        rutaClienteInfo.put("id_cliente", programacionExistente.getId_cliente());
                        rutaClienteInfo.put("orden", programacionExistente.getOrden());
                        rutaClienteInfo.put("kg_corriente_programado", programacionExistente.getKg_corriente_programado());
                        rutaClienteInfo.put("kg_especial_programado", programacionExistente.getKg_especial_programado());
                        rutaClienteInfo.put("fecha_programada", programacionExistente.getFecha_programada().toString());
                    } else {
                        // No hay programación, buscar valores del día anterior o usar por defecto
                        LocalDate fechaAnterior = fecha.minusDays(1);
                        ProgramacionEntrega progAnterior = programacionEntregaRepository
                            .findByIdRutaAndIdClienteAndFechaProgramada(ruta.getId(), rutaCliente.getId_cliente(), fechaAnterior);
                        
                        rutaClienteInfo.put("id", rutaCliente.getId());
                        rutaClienteInfo.put("id_ruta", rutaCliente.getId_ruta());
                        rutaClienteInfo.put("id_cliente", rutaCliente.getId_cliente());
                        rutaClienteInfo.put("orden", rutaCliente.getOrden());
                        rutaClienteInfo.put("fecha_programada", fecha.toString());
                        
                        // Usar valores del día anterior si existen, sino valores por defecto
                        if (progAnterior != null) {
                            rutaClienteInfo.put("kg_corriente_programado", progAnterior.getKg_corriente_programado());
                            rutaClienteInfo.put("kg_especial_programado", progAnterior.getKg_especial_programado());
                        } else {
                            rutaClienteInfo.put("kg_corriente_programado", 10.0); // Valor por defecto
                            rutaClienteInfo.put("kg_especial_programado", 5.0);   // Valor por defecto
                        }
                    }
                    
                    clienteData.put("rutaCliente", rutaClienteInfo);
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