package com.microservice.entrega.service;

import java.util.Map;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Collectors;

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
import com.microservice.entrega.entity.Ruta;
import com.microservice.entrega.entity.RutaCliente;
import com.microservice.entrega.repository.RutaClienteRepository;
import com.microservice.entrega.repository.RutaRepository;

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

    public List<ClienteDTO> getOptimizedRouteORTools(List<ClienteDTO> clientes) {

        // Se construye la matriz de distancias
        int size = clientes.size() + 1;
        Optional<Ruta> origen = rutaRepository.findById(((long) 1));

        List<double[]> locations = new ArrayList();
        locations.add(new double[] { origen.get().getLatitud(), origen.get().getLongitud() });

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

    public Ruta getOrigenRuta() {
        return rutaRepository.findById(1L).orElseThrow(() -> new RuntimeException("Ruta de origen no encontrada"));
    }

    public List<ClienteDTO> getClientesDeRuta(Long id_ruta) {
        Optional<RutaCliente> rutaCliente = rutaClienteRepository.findById(id_ruta);
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
}
