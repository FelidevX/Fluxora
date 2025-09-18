package com.microservice.entrega.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.microservice.entrega.entity.SesionEntrega;

public interface SesionEntregaRepository extends JpaRepository<SesionEntrega, Long> {

}
