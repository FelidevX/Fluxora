package com.microservice.cliente.service;

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

    /**
     * Obtiene todos los clientes con su información de ruta incluida
     * @return Lista de ClienteDTO con información completa incluyendo ruta
     */
    public List<ClienteDTO> getAllClientesConInfoRuta() {
        List<Cliente> clientes = clienteRepository.findAll();
        return clientes.stream()
                .map(cliente -> {
                    String nombreRuta = obtenerNombreRuta(cliente.getId());
                    return clienteMapper.toDTO(cliente, nombreRuta);
                })
                .collect(Collectors.toList());
    }

    /**
     * Obtiene el nombre de la ruta para un cliente específico
     * @param idCliente ID del cliente
     * @return Nombre de la ruta o "Sin ruta asignada" si no tiene ruta
     */
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
        return clientes.stream()
                .map(cliente -> {
                    String nombreRuta = obtenerNombreRuta(cliente.getId());
                    return clienteMapper.toDTO(cliente, nombreRuta);
                })
                .collect(Collectors.toList());
    }

    public ClienteDTO getClienteById(Long id) {
        Cliente cliente = clienteRepository.findById(id).orElse(null);
        if (cliente != null) {
            String nombreRuta = obtenerNombreRuta(id);
            return clienteMapper.toDTO(cliente, nombreRuta);
        }
        return null;
    }

    /**
     * Elimina un cliente y todas sus relaciones en cascada
     * Primero elimina las relaciones con rutas y entregas, luego elimina el cliente
     * @param id ID del cliente a eliminar
     */
    @Transactional
    public void deleteCliente(Long id) {
        // Verificar que el cliente existe
        Cliente cliente = clienteRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Cliente no encontrado con ID: " + id));
        
        try {
            // Primero eliminar todas las relaciones del cliente con rutas y entregas
            entregaServiceClient.eliminarRelacionesCliente(id);
            
            // Luego eliminar el cliente
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
