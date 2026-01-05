package com.microservice.cliente.service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.microservice.cliente.client.EntregaServiceClient;
import com.microservice.cliente.dto.ClienteDTO;
import com.microservice.cliente.entity.Cliente;
import com.microservice.cliente.mapper.ClienteMapper;
import com.microservice.cliente.repository.ClienteRepository;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final EntregaServiceClient entregaServiceClient;
    private final ClienteMapper clienteMapper;

    public ClienteService(ClienteRepository clienteRepository, 
                         EntregaServiceClient entregaServiceClient,
                         ClienteMapper clienteMapper) {
        this.clienteRepository = clienteRepository;
        this.entregaServiceClient = entregaServiceClient;
        this.clienteMapper = clienteMapper;
    }


    public List<Cliente> getAllClientes() {
        return clienteRepository.findAll();
    }

    public List<ClienteDTO> getAllClientesConInfoRuta() {
        List<Cliente> clientes = clienteRepository.findAll();
        
        if(clientes.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> clienteIds = clientes.stream()
                .map(Cliente::getId)
                .collect(Collectors.toList());

        Map<String, String> rutasPorCliente = obtenerNombresRutaBatch(clienteIds);

        return clientes.stream().map(
            cliente -> {
                String nombreRuta = rutasPorCliente.getOrDefault(
                    cliente.getId().toString(), 
                    "Sin ruta asignada"
                );
                return clienteMapper.toDTO(cliente, nombreRuta);
            }
        ).collect(Collectors.toList());
    }

    private Map<String, String> obtenerNombresRutaBatch(List<Long> clienteIds) {
        try {
            ResponseEntity<Map<String, String>> response = 
                entregaServiceClient.getNombresRutasPorClientes(clienteIds);
            
            if (response.getBody() != null) {
                return response.getBody();
            }
            
            System.err.println("El servicio de entregas retornó body vacío");
            return Collections.emptyMap();
            
        } catch (Exception e) {
            System.err.println("Error al obtener nombres de rutas batch para " + 
                             clienteIds.size() + " clientes: " + e.getMessage());
            return Collections.emptyMap();
        }
    }

    private String obtenerNombreRuta(Long idCliente) {
        try {
            ResponseEntity<Map<String, Object>> response = entregaServiceClient.getNombreRutaPorCliente(idCliente);
            if (response.getBody() != null && response.getBody().get("nombreRuta") != null) {
                return (String) response.getBody().get("nombreRuta");
            }
            return "Sin ruta asignada";
        } catch (Exception e) {
            System.err.println("Error al obtener nombre de ruta para cliente " + idCliente + ": " + e.getMessage());
            return "Sin ruta asignada";
        }
    }

    public Cliente addCliente(Cliente cliente) {
        return clienteRepository.save(cliente);
    }

    public List<ClienteDTO> getClienteByIds(List<Long> ids) {
        List<Cliente> clientes = clienteRepository.findAllById(ids);

        if(clientes.isEmpty()) {
            return Collections.emptyList();
        }

        if(clientes.size() > 1) {
            List<Long> clienteIds = clientes.stream()
                .map(Cliente::getId)
                .collect(Collectors.toList());

            Map<String, String> rutasPorCliente = obtenerNombresRutaBatch(clienteIds);

            return clientes.stream()
                .map(cliente -> {
                    String nombreRuta = rutasPorCliente.getOrDefault(
                        cliente.getId().toString(), 
                        "Sin ruta asignada"
                    );
                    return clienteMapper.toDTO(cliente, nombreRuta);
                })
                .collect(Collectors.toList());
        } else {
            Cliente cliente = clientes.get(0);
            String nombreRuta = obtenerNombreRuta(cliente.getId());
            return List.of(clienteMapper.toDTO(cliente, nombreRuta));
        }
    }

    public ClienteDTO getClienteById(Long id) {
        Cliente cliente = clienteRepository.findById(id).orElse(null);
        if (cliente != null) {
            String nombreRuta = obtenerNombreRuta(id);
            return clienteMapper.toDTO(cliente, nombreRuta);
        }
        return null;
    }

    @Transactional
    public void deleteCliente(Long id) {
        clienteRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Cliente no encontrado con ID: " + id));
        
        try {
            entregaServiceClient.eliminarRelacionesCliente(id);
            
            clienteRepository.deleteById(id);
            
        } catch (Exception e) {
            throw new RuntimeException("Error al eliminar cliente: " + e.getMessage(), e);
        }
    }

    public ResponseEntity<Cliente> updateCliente(Long id, Cliente clienteDetails) {
        Cliente cliente = clienteRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Cliente no encontrado con ID: " + id));
        
        cliente.setNombre(clienteDetails.getNombre());
        cliente.setNombreNegocio(clienteDetails.getNombreNegocio());
        cliente.setContacto(clienteDetails.getContacto());
        cliente.setDireccion(clienteDetails.getDireccion());
        cliente.setLatitud(clienteDetails.getLatitud());
        cliente.setLongitud(clienteDetails.getLongitud());
        cliente.setEmail(clienteDetails.getEmail());
        cliente.setPrecioCorriente(clienteDetails.getPrecioCorriente());
        cliente.setPrecioEspecial(clienteDetails.getPrecioEspecial());
        
        Cliente updatedCliente = clienteRepository.save(cliente);
        return ResponseEntity.ok(updatedCliente);
    }
}
