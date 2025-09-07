package com.microservice.cliente.service;

import java.util.List;
import java.util.stream.Collector;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.microservice.cliente.dto.ClienteDTO;
import com.microservice.cliente.entity.Cliente;
import com.microservice.cliente.repository.ClienteRepository;

@Service
public class ClienteService {

    @Autowired
    private ClienteRepository clienteRepository;

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
                        cliente.getLatitud(), cliente.getLongitud()))
                .collect(Collectors.toList());
    }

}
