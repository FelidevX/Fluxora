package com.microservice.cliente.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.microservice.cliente.entity.Cliente;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
}
