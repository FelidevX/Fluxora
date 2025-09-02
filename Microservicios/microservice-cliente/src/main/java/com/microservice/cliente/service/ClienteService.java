package com.microservice.cliente.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

}
