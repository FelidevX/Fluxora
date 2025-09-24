package com.microservice.entrega.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.microservice.entrega.entity.RegistroEntrega;

public interface RegistroEntregaRepository extends JpaRepository<RegistroEntrega, Long> {

}
