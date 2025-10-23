package com.microservice.cliente.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.microservice.cliente.service.ClienteService;
import com.microservice.cliente.dto.ClienteDTO;
import com.microservice.cliente.entity.Cliente;

@RestController
@RequestMapping("/clientes")
public class ClienteController {

    @Autowired
    private ClienteService clienteService;

    @GetMapping()
    public List<Cliente> getAllClientes() {
        return clienteService.getAllClientes();
    }

    @PostMapping()
    public Cliente addCliente(@RequestBody Cliente cliente) {
        return clienteService.addCliente(cliente);
    }

    @GetMapping("/{id}")
    public List<ClienteDTO> getClienteByIds(@PathVariable List<Long> id) {
        return clienteService.getClienteByIds(id);
    }

    @GetMapping("/cliente/{id}")
    public ClienteDTO getClienteById(@PathVariable Long id) {
        return clienteService.getClienteById(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteCliente(@PathVariable Long id) {
        try {
            clienteService.deleteCliente(id);
            return ResponseEntity.ok("Cliente eliminado exitosamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al eliminar cliente: " + e.getMessage());
        }
    }

}
