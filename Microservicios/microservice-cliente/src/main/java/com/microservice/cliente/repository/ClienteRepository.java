package com.microservice.cliente.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.microservice.cliente.entity.Cliente;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

}
