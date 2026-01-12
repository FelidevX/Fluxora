package com.microservice.entrega.service;

import java.util.Map;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import com.google.ortools.Loader;
import com.google.ortools.constraintsolver.Assignment;
import com.google.ortools.constraintsolver.FirstSolutionStrategy;
import com.google.ortools.constraintsolver.RoutingIndexManager;
import com.google.ortools.constraintsolver.RoutingModel;
import com.google.ortools.constraintsolver.RoutingSearchParameters;
import com.google.ortools.constraintsolver.main;
import com.microservice.entrega.client.ClienteServiceClient;
import com.microservice.entrega.dto.ClienteDTO;
import com.microservice.entrega.dto.ClienteConRutaDTO;
import com.microservice.entrega.entity.SesionReparto;
import com.microservice.entrega.entity.ProgramacionEntrega;
import com.microservice.entrega.entity.RegistroEntrega;
import com.microservice.entrega.entity.TipoMovimiento;
import com.microservice.entrega.entity.RegistroEntrega;
import com.microservice.entrega.entity.Ruta;
import com.microservice.entrega.entity.RutaCliente;
import com.microservice.entrega.repository.RutaClienteRepository;
import com.microservice.entrega.repository.RutaRepository;
import com.microservice.entrega.repository.SesionRepartoRepository;
import com.microservice.entrega.repository.ProgramacionEntregaRepository;
import com.microservice.entrega.repository.RegistroEntregaRepository;

@Service
public class RutaService {
    static {
        Loader.loadNativeLibraries();
    }

    @Autowired
    private RutaRepository rutaRepository;

    @Autowired
    private RutaClienteRepository rutaClienteRepository;

    @Autowired
    private ClienteServiceClient clienteServiceClient;

    @Autowired
    private SesionRepartoRepository sesionRepartoRepository;

    @Autowired
    private RegistroEntregaRepository registroEntregaRepository;

    @Autowired
    private ProgramacionEntregaRepository programacionEntregaRepository;

    public List<ClienteDTO> getOptimizedRouteORTools(Long id_ruta, List<ClienteDTO> clientes) {

        // Ordenar clientes por ID para garantizar consistencia en el orden de entrada
        List<ClienteDTO> clientesOrdenados = new ArrayList<>(clientes);
        clientesOrdenados.sort((c1, c2) -> c1.getId().compareTo(c2.getId()));

        // Se construye la matriz de distancias
        int size = clientesOrdenados.size() + 1;
        Ruta origen = getOrigenRuta(id_ruta);

        List<double[]> locations = new ArrayList<>();
        locations.add(new double[] { origen.getLatitud(), origen.getLongitud() });

        for (ClienteDTO c : clientesOrdenados) {
            locations.add(new double[] { c.getLatitud(), c.getLongitud() });
        }

        long[][] distanceMatrix = getDistanceMatrixFromOSRM(locations);

        RoutingIndexManager manager = new RoutingIndexManager(size, 1, 0);
        RoutingModel routing = new RoutingModel(manager);

        final int transitCallbackIndex = routing.registerTransitCallback((long fromIndex, long toIndex) -> {
            int fromNode = manager.indexToNode(fromIndex);
            int toNode = manager.indexToNode(toIndex);
            return distanceMatrix[fromNode][toNode];
        });

        routing.setArcCostEvaluatorOfAllVehicles(transitCallbackIndex);

        RoutingSearchParameters searchParameters = main.defaultRoutingSearchParameters().toBuilder()
                .setFirstSolutionStrategy(FirstSolutionStrategy.Value.PATH_CHEAPEST_ARC).build();

        Assignment solution = routing.solveWithParameters(searchParameters);

        List<ClienteDTO> orderedClients = new ArrayList<>();
        if (solution != null) {
            long index = routing.start(0);
            while (!routing.isEnd(index)) {
                int nodeIndex = manager.indexToNode(index);
                if (nodeIndex != 0) {
                    orderedClients.add(clientesOrdenados.get(nodeIndex - 1));
                }
                index = solution.value(routing.nextVar(index));
            }
        }
        return orderedClients;
    }

    public String getOsrmRoute(List<ClienteDTO> orderedClients, Ruta origen) {
        StringBuilder coords = new StringBuilder();
        // Agrega primero el punto de partida (driver)
        coords.append(origen.getLongitud()).append(",").append(origen.getLatitud());
        // Luego los clientes en el orden óptimo
        for (ClienteDTO c : orderedClients) {
            coords.append(";").append(c.getLongitud()).append(",").append(c.getLatitud());
        }

        coords.append(";").append(origen.getLongitud()).append(",").append(origen.getLatitud());

        String url = "http://router.project-osrm.org/route/v1/driving/" + coords +
                "?overview=full&geometries=geojson";

        RestTemplate restTemplate = new RestTemplate();
        return restTemplate.getForObject(url, String.class);
    }

    private long[][] getDistanceMatrixFromOSRM(List<double[]> locations) {
        if (locations == null || locations.isEmpty()) {
            throw new IllegalArgumentException("La lista de ubicaciones no puede ser nula o vacía");
        }
        StringBuilder coords = new StringBuilder();
        for (double[] loc : locations) {
            if (loc.length != 2) {
                throw new IllegalArgumentException("Cada ubicación debe tener exactamente dos coordenadas");
            }
            coords.append(loc[1]) // Longitud
                    .append(",")
                    .append(loc[0]) // Latitud
                    .append(";");
        }

        coords.setLength(coords.length() - 1);

        String url = "http://router.project-osrm.org/table/v1/driving/" + coords.toString() + "?annotations=distance";

        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<Map<String, Object>> responseEntity = restTemplate.exchange(url, HttpMethod.GET, null,
                new ParameterizedTypeReference<Map<String, Object>>() {
                });

        Map<String, Object> response = responseEntity.getBody();
        if (response == null) {
            throw new RuntimeException("Respuesta vacía de OSRM");
        }

        // Extraer la matriz de distancias desde el JSON
        List<List<Number>> distances = (List<List<Number>>) response.get("distances");
        if (distances == null) {
            throw new RuntimeException("Matriz de distancias vacía");
        }
        int size = distances.size();
        long[][] distanceMatrix = new long[size][size];

        for (int i = 0; i < size; i++) {
            for (int j = 0; j < size; j++) {
                distanceMatrix[i][j] = distances.get(i).get(j).longValue();
            }
        }
        return distanceMatrix;
    }

    public Ruta getOrigenRuta(Long id_ruta) {
        return rutaRepository.findById(id_ruta).orElseThrow(() -> new RuntimeException("Ruta de origen no encontrada"));
    }

    public List<ClienteDTO> getClientesDeRuta(Long id_ruta) {
        List<RutaCliente> rutaCliente = rutaClienteRepository.findById_ruta(id_ruta);
        List<Long> idClientes = rutaCliente.stream().map(RutaCliente::getId_cliente).toList();
        List<ClienteDTO> clientes = clienteServiceClient.getClientesByIds(idClientes);
        
        // Ordenar por ID para consistencia
        clientes.sort((c1, c2) -> c1.getId().compareTo(c2.getId()));
        return clientes;
    }

    public List<Ruta> getAllRutas() {
        return rutaRepository.findAll();
    }

    public List<ClienteDTO> getClientesSinRuta() {
        try {
            List<ClienteDTO> allClients = clienteServiceClient.getAllClientes();
            List<Long> assignmentClient = rutaClienteRepository.findAllClienteIds();

            return allClients.stream().filter(cliente -> !assignmentClient.contains(cliente.getId()))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener clientes sin ruta: " + e.getMessage());
        }
    }

    public List<ClienteConRutaDTO> getClientesConRuta() {
        try {
            // Obtener todos los clientes
            List<ClienteDTO> allClients = clienteServiceClient.getAllClientes();
            
            // Obtener todas las relaciones ruta-cliente
            List<RutaCliente> rutaClientes = rutaClienteRepository.findAll();
            
            // Obtener todas las rutas
            List<Ruta> rutas = rutaRepository.findAll();
            
            // Crear un mapa de rutaId -> nombre de ruta para búsqueda rápida
            java.util.Map<Long, String> rutaNombresMap = rutas.stream()
                .collect(java.util.stream.Collectors.toMap(Ruta::getId, Ruta::getNombre));
            
            // Filtrar clientes que están asignados y agregar información de ruta
            return rutaClientes.stream()
                .map(rc -> {
                    // Buscar el cliente correspondiente
                    ClienteDTO cliente = allClients.stream()
                        .filter(c -> c.getId().equals(rc.getId_cliente()))
                        .findFirst()
                        .orElse(null);
                    
                    if (cliente == null) return null;
                    
                    // Crear ClienteConRutaDTO
                    ClienteConRutaDTO clienteConRuta = new ClienteConRutaDTO();
                    clienteConRuta.setId(cliente.getId());
                    clienteConRuta.setNombre(cliente.getNombre());
                    clienteConRuta.setDireccion(cliente.getDireccion());
                    clienteConRuta.setLatitud(cliente.getLatitud());
                    clienteConRuta.setLongitud(cliente.getLongitud());
                    clienteConRuta.setEmail(cliente.getEmail());
                    clienteConRuta.setPrecioCorriente(cliente.getPrecioCorriente());
                    clienteConRuta.setPrecioEspecial(cliente.getPrecioEspecial());
                    clienteConRuta.setRutaId(rc.getId_ruta());
                    clienteConRuta.setRutaNombre(rutaNombresMap.get(rc.getId_ruta()));
                    
                    return clienteConRuta;
                })
                .filter(c -> c != null)
                .distinct() // Evitar duplicados si un cliente está en múltiples fechas de la misma ruta
                .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener clientes con ruta: " + e.getMessage());
        }
    }

    public void asignarClienteARuta(Long idRuta, Long idCliente) {
        try {
            // Verifica que la ruta existe
            if (!rutaRepository.existsById(idRuta)) {
                throw new RuntimeException("La ruta con ID " + idRuta + " no existe");
            }

            // Verifica que el cliente no esté asignado a una ruta
            List<Long> clientesAsignados = rutaClienteRepository.findAllClienteIds();
            if (clientesAsignados.contains(idCliente)) {
                throw new RuntimeException("El cliente con ID " + idCliente + " ya está asignado a una ruta");
            }

            RutaCliente rutaCliente = new RutaCliente();
            rutaCliente.setId_ruta(idRuta);
            rutaCliente.setId_cliente(idCliente);
            rutaCliente.setOrden(1); // Revisar si el orden afecta en algo

            rutaClienteRepository.save(rutaCliente);
        } catch (Exception e) {
            throw new RuntimeException("Error al asignar cliente a ruta: " + e.getMessage());
        }
    }

    @Transactional
    public void reasignarClienteARuta(Long idRuta, Long idCliente) {
        try {
            // Verifica que la ruta destino existe
            if (!rutaRepository.existsById(idRuta)) {
                throw new RuntimeException("La ruta con ID " + idRuta + " no existe");
            }

            // Eliminar las asignaciones existentes del cliente (de todas las rutas y fechas)
            rutaClienteRepository.deleteByIdCliente(idCliente);

            // Crear nueva asignación
            RutaCliente rutaCliente = new RutaCliente();
            rutaCliente.setId_ruta(idRuta);
            rutaCliente.setId_cliente(idCliente);
            rutaCliente.setOrden(1);

            rutaClienteRepository.save(rutaCliente);
        } catch (Exception e) {
            throw new RuntimeException("Error al reasignar cliente a ruta: " + e.getMessage());
        }
    }

    @Transactional
    public void deleteRuta(Long idRuta) {
        try {
            // Verifica que la ruta existe
            if (!rutaRepository.existsById(idRuta)) {
                throw new RuntimeException("La ruta con ID " + idRuta + " no existe");
            }

            // Primero eliminar todas las relaciones ruta-cliente
            List<RutaCliente> rutaClientes = rutaClienteRepository.findByIdRuta(idRuta);
            if (!rutaClientes.isEmpty()) {
                rutaClienteRepository.deleteAll(rutaClientes);
            }

            // Ahora eliminar la ruta
            rutaRepository.deleteById(idRuta);
        } catch (Exception e) {
            throw new RuntimeException("Error al eliminar ruta: " + e.getMessage());
        }
    }

    public Long getRutaIdByDriverId(Long driverId) {
        Optional<Ruta> ruta = rutaRepository.findByIdDriver(driverId);
        if (ruta.isEmpty()) {
            throw new RuntimeException("No se encontró una ruta para el ID de conductor proporcionado");
        }
        return ruta.get().getId();
    }

    public Long iniciarRuta(Long idRuta) {
        try {
            Ruta ruta = rutaRepository.findById(idRuta)
                    .orElseThrow(() -> new RuntimeException("Ruta no encontrada con ID: " + idRuta));
            LocalDate fechaActual = LocalDate.now();

            try {
                Optional<SesionReparto> pedidoExistente = sesionRepartoRepository.findByIdDriverAndFecha(
                        ruta.getId_driver(),
                        fechaActual);

                if (pedidoExistente.isPresent()) {
                    return pedidoExistente.get().getId();
                }
            } catch (Exception e) {
                System.err.println("Error al buscar pedido existente: " + e.getMessage());
                System.err.println("Continuando con la creación de nuevo pedido...");
            }
            // Obtener clientes de la ruta
            List<RutaCliente> clientesRuta = rutaClienteRepository.findById_ruta(idRuta);

            if (clientesRuta.isEmpty()) {
                throw new RuntimeException("No hay clientes asignados a la ruta con ID: " + idRuta);
            }

            // Filtrar solo los clientes con fecha programada para hoy
            List<ProgramacionEntrega> programacionesHoy = programacionEntregaRepository.findByIdRutaAndFechaProgramada(idRuta, fechaActual);

            List<Long> clientesHoy = programacionesHoy.stream()
                    .map(ProgramacionEntrega::getId_cliente)
                    .distinct()
                    .collect(Collectors.toList());

            if (clientesHoy.isEmpty()) {
                throw new RuntimeException("No hay clientes programados para hoy en la ruta con ID: " + idRuta);
            }

            // Obtener programaciones de entrega para la ruta y fecha actual
            if (programacionesHoy.isEmpty()) {
                throw new RuntimeException("No hay entregas programadas para hoy en la ruta con ID: " + idRuta);
            }

            Double totalKgCorriente = programacionesHoy.stream()
                    .map(pe -> pe.getKg_corriente_programado()) 
                    .reduce(0.0, Double::sum);

            Double totalKgEspecial = programacionesHoy.stream()
                    .map(pe -> pe.getKg_especial_programado()) 
                    .reduce(0.0, Double::sum);

            SesionReparto pedido = new SesionReparto();
            pedido.setId_driver(ruta.getId_driver());
            pedido.setFecha(fechaActual); // Establecer fecha manualmente
            pedido.setKg_corriente(totalKgCorriente);
            pedido.setKg_especial(totalKgEspecial);
            pedido.setCorriente_devuelto(0.0);
            pedido.setEspecial_devuelto(0.0);

            SesionReparto pedidoGuardado = sesionRepartoRepository.save(pedido);

            return pedidoGuardado.getId();
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error al iniciar la ruta: " + e.getMessage());
        }
    }

    public Map<String, Object> finalizarRuta(Long idPedido) {
        try {

            SesionReparto pedido = sesionRepartoRepository.findById(idPedido)
                    .orElseThrow(() -> new RuntimeException("Pedido no encontrado con ID: " + idPedido));

            List<RegistroEntrega> entregas = registroEntregaRepository.findByIdPedido(idPedido);

            if (entregas.isEmpty()) {
                System.err.println("NO SE ENCONTRARON ENTREGAS PARA ESTE PEDIDO");
                throw new RuntimeException("No hay entregas registradas para este pedido");
            }

            Double totalCorrienteEntregado = entregas.stream()
                    .map(entrega -> entrega.getCorriente_entregado() != null ? entrega.getCorriente_entregado() : 0.0)
                    .reduce(0.0, Double::sum);

            Double totalEspecialEntregado = entregas.stream()
                    .map(entrega -> entrega.getEspecial_entregado() != null ? entrega.getEspecial_entregado() : 0.0)
                    .reduce(0.0, Double::sum);

            Double corrienteDevuelto = pedido.getKg_corriente() - totalCorrienteEntregado;
            Double especialDevuelto = pedido.getKg_especial() - totalEspecialEntregado;

            if (corrienteDevuelto < 0) {
                System.err.println("Corriente devuelto negativo: " + corrienteDevuelto);
                corrienteDevuelto = 0.0;
            }
            if (especialDevuelto < 0) {
                System.err.println("Especial devuelto negativo: " + especialDevuelto);
                especialDevuelto = 0.0;
            }

            pedido.setCorriente_devuelto(corrienteDevuelto);
            pedido.setEspecial_devuelto(especialDevuelto);
            pedido.setHora_retorno(LocalDateTime.now());

            SesionReparto pedidoActualizado = sesionRepartoRepository.save(pedido);

            // Calcular resumen financiero
            Double totalDineroRecaudado = entregas.stream()
                    .filter(e -> e.getTipo() == TipoMovimiento.VENTA)
                    .map(e -> e.getMonto_total() != null ? e.getMonto_total() : 0.0)
                    .reduce(0.0, Double::sum);

            int totalEntregas = entregas.size();
            int entregasVenta = (int) entregas.stream().filter(e -> e.getTipo() == TipoMovimiento.VENTA).count();

            // Crear respuesta con resumen
            Map<String, Object> resumen = new HashMap<>();
            resumen.put("totalDineroRecaudado", totalDineroRecaudado);
            resumen.put("totalCorrienteEntregado", totalCorrienteEntregado);
            resumen.put("totalEspecialEntregado", totalEspecialEntregado);
            resumen.put("corrienteDevuelto", corrienteDevuelto);
            resumen.put("especialDevuelto", especialDevuelto);
            resumen.put("totalEntregas", totalEntregas);
            resumen.put("entregasVenta", entregasVenta);
            resumen.put("kgCorrienteSalida", pedido.getKg_corriente());
            resumen.put("kgEspecialSalida", pedido.getKg_especial());

            return resumen;
        } catch (Exception e) {
            System.err.println("Error al finalizar ruta: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error al finalizar la ruta: " + e.getMessage());
        }
    }

    /**
     * Obtiene el nombre de la ruta asociada a un cliente específico
     * @param idCliente ID del cliente
     * @return Nombre de la ruta o null si el cliente no tiene ruta asignada
     */
    public String getNombreRutaPorCliente(Long idCliente) {
        try {
            // Buscar todas las relaciones del cliente con rutas
            List<Long> clientesAsignados = rutaClienteRepository.findAllClienteIds();
            
            if (!clientesAsignados.contains(idCliente)) {
                return null; // Cliente sin ruta asignada
            }

            // Obtener todas las relaciones RutaCliente y buscar la del cliente
            List<RutaCliente> todasRelaciones = rutaClienteRepository.findAll();
            Optional<Long> idRuta = todasRelaciones.stream()
                    .filter(rc -> rc.getId_cliente().equals(idCliente))
                    .map(RutaCliente::getId_ruta)
                    .findFirst();

            if (idRuta.isEmpty()) {
                return null;
            }

            // Obtener el nombre de la ruta
            Optional<Ruta> ruta = rutaRepository.findById(idRuta.get());
            return ruta.map(Ruta::getNombre).orElse(null);

        } catch (Exception e) {
            System.err.println("Error al obtener nombre de ruta para cliente " + idCliente + ": " + e.getMessage());
            return null;
        }
    }

    public List<ClienteDTO> getClientesConProgramacion(Long id_ruta, LocalDate fecha) {
        try {
            // Obtener todas las programaciones de entregas para la ruta y fecha
            List<ProgramacionEntrega> programaciones = programacionEntregaRepository
                    .findByIdRutaAndFechaProgramada(id_ruta, fecha);
            
            // Extraer IDs únicos de clientes con programación
            List<Long> idClientes = programaciones.stream()
                    .map(ProgramacionEntrega::getId_cliente)
                    .distinct()
                    .collect(Collectors.toList());
            
            // Obtener información completa de los clientes
            if (idClientes.isEmpty()) {
                return new ArrayList<>();
            }
            
            List<ClienteDTO> clientes = clienteServiceClient.getClientesByIds(idClientes);
            
            // Ordenar por ID para consistencia
            clientes.sort((c1, c2) -> c1.getId().compareTo(c2.getId()));
            return clientes;
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener clientes con programación: " + e.getMessage());
        }
    }

    public Map<String, String> obtenerNombresRutasPorClientes(List<Long> clienteIds) {
        try {
            if (clienteIds == null || clienteIds.isEmpty()) {
                return new HashMap<>();
            }

            // 1. Obtener solo las relaciones de los clientes solicitados (query filtrada en BD)
            List<RutaCliente> relaciones = rutaClienteRepository.findByIdClienteIn(clienteIds);
            
            if (relaciones.isEmpty()) {
                return new HashMap<>();
            }
            
            List<Long> rutaIds = relaciones.stream()
                    .map(RutaCliente::getId_ruta)
                    .distinct()
                    .collect(Collectors.toList());
            
            List<Ruta> rutas = rutaRepository.findAllById(rutaIds);
            
            Map<Long, String> rutaNombresMap = rutas.stream()
                    .collect(Collectors.toMap(
                        Ruta::getId,
                        Ruta::getNombre
                    ));
            
            Map<String, String> resultado = relaciones.stream()
                    .filter(rc -> rutaNombresMap.containsKey(rc.getId_ruta()))
                    .collect(Collectors.toMap(
                        rc -> rc.getId_cliente().toString(),
                        rc -> rutaNombresMap.get(rc.getId_ruta()),
                        (existing, replacement) -> existing
                    ));
            
            return resultado;
            
        } catch (Exception e) {
            System.err.println("Error al obtener nombres de rutas batch para " + clienteIds.size() + " clientes: " + e.getMessage());
            e.printStackTrace();
            return new HashMap<>();
        }
    }

    /**
     * Obtener todas las rutas activas con información básica
     */
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

    /**
     * Asignar un driver a una ruta
     */
    public void asignarDriverARuta(Long idRuta, Long idDriver) {
        Ruta ruta = rutaRepository.findById(idRuta)
                .orElseThrow(() -> new RuntimeException("Ruta no encontrada"));

        ruta.setId_driver(idDriver);
        rutaRepository.save(ruta);
    }

    /**
     * Crear nueva ruta con los datos proporcionados
     */
    public String crearRuta(Map<String, Object> datosRuta) {
        try {
            String nombre = (String) datosRuta.get("nombre");
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

    /**
     * Eliminar una ruta y todas sus relaciones
     */
    @Transactional
    public void eliminarRuta(Long idRuta) {
        System.out.println("Eliminando ruta ID: " + idRuta);
        
        // Verificar que la ruta existe
        Ruta ruta = rutaRepository.findById(idRuta)
            .orElseThrow(() -> new RuntimeException("Ruta no encontrada"));
        
        // Eliminar programaciones de entregas asociadas a los clientes de esta ruta
        List<RutaCliente> rutasClientes = rutaClienteRepository.findByIdRuta(idRuta);
        for (RutaCliente rc : rutasClientes) {
            programacionEntregaRepository.deleteByIdCliente(rc.getId_cliente());
        }
        
        // Eliminar relaciones ruta-cliente
        rutaClienteRepository.deleteAll(rutasClientes);
        
        // Eliminar la ruta
        rutaRepository.delete(ruta);
        
        System.out.println("Ruta eliminada exitosamente");
    }
}
