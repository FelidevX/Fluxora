package com.microservice.entrega.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.microservice.entrega.entity.Ruta;

public interface RutaRepository extends JpaRepository<Ruta, Long> {

}
