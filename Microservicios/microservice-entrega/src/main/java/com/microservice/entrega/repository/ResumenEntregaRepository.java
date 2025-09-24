package com.microservice.entrega.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.microservice.entrega.entity.ResumenEntrega;

public interface ResumenEntregaRepository extends JpaRepository<ResumenEntrega, Long> {

}
