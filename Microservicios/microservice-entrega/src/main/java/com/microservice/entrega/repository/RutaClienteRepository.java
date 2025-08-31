package com.microservice.entrega.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.microservice.entrega.entity.RutaCliente;

public interface RutaClienteRepository extends JpaRepository<RutaCliente, Long> {

}
