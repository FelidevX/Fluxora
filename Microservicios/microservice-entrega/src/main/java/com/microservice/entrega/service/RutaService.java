package com.microservice.entrega.service;

import java.util.Map;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Collectors;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
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
import com.microservice.entrega.entity.SesionReparto;
import com.microservice.entrega.entity.ProgramacionEntrega;
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

        // Se construye la matriz de distancias
        int size = clientes.size() + 1;
        Ruta origen = getOrigenRuta(id_ruta);

        List<double[]> locations = new ArrayList();
        locations.add(new double[] { origen.getLatitud(), origen.getLongitud() });

        for (ClienteDTO c : clientes) {
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
                    orderedClients.add(clientes.get(nodeIndex - 1));
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
        return clienteServiceClient.getClientesByIds(idClientes);
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

    public void finalizarRuta(Long idPedido) {
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
        } catch (Exception e) {
            System.err.println("Error al finalizar ruta: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error al finalizar la ruta: " + e.getMessage());
        }
    }
}
