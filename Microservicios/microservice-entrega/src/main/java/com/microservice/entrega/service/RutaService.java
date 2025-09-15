package com.microservice.entrega.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
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
        long[][] distanceMatrix = new long[size][size];
        Optional<Ruta> origen = rutaRepository.findById(((long) 1));

        List<double[]> locations = new ArrayList();
        locations.add(new double[] { origen.get().getLatitud(), origen.get().getLongitud() });

        for (ClienteDTO c : clientes) {
            locations.add(new double[] { c.getLatitud(), c.getLongitud() });
        }

        for (int i = 0; i < size; i++) {
            for (int j = 0; j < size; j++) {
                distanceMatrix[i][j] = (long) haversine(locations.get(i)[0], locations.get(i)[1], locations.get(j)[0],
                        locations.get(j)[1]) * 1000;
            }
        }

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

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
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

    public Ruta getOrigenRuta() {
        return rutaRepository.findById(0L).orElseThrow(() -> new RuntimeException("Ruta de origen no encontrada"));
    }

    public List<ClienteDTO> getClientesDeRuta(Long id_ruta) {
        Optional<RutaCliente> rutaCliente = rutaClienteRepository.findById(id_ruta);
        List<Long> idClientes = rutaCliente.stream().map(RutaCliente::getId_cliente).toList();
        return clienteServiceClient.getClientesByIds(idClientes);
    }

    public List<Ruta> getAllRutas() {
        return rutaRepository.findAll();
    }
}
