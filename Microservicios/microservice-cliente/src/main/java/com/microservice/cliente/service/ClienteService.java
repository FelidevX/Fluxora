package com.microservice.cliente.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.microservice.cliente.client.EntregaServiceClient;
import com.microservice.cliente.dto.ClienteDTO;
import com.microservice.cliente.entity.Cliente;
import com.microservice.cliente.repository.ClienteRepository;

@Service
public class ClienteService {

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private EntregaServiceClient entregaServiceClient;

    public List<Cliente> getAllClientes() {
        return clienteRepository.findAll();
    }

    public Cliente addCliente(Cliente cliente) {
        return clienteRepository.save(cliente);
    }

    public List<ClienteDTO> getClienteByIds(List<Long> ids) {
        List<Cliente> clientes = clienteRepository.findAllById(ids);
        return clientes.stream()
                .map(cliente -> new ClienteDTO(cliente.getId(), cliente.getNombre(),
                        cliente.getDireccion(), cliente.getLatitud(), cliente.getLongitud(), cliente.getEmail()))
                .collect(Collectors.toList());
    }

    public ClienteDTO getClienteById(Long id) {
        Cliente cliente = clienteRepository.findById(id).orElse(null);
        if (cliente != null) {
            return new ClienteDTO(cliente.getId(), cliente.getNombre(),
                    cliente.getDireccion(), cliente.getLatitud(), cliente.getLongitud(), cliente.getEmail());
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

}
