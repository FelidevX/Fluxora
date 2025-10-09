package com.microservice.entrega.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.microservice.entrega.entity.Ruta;

public interface RutaRepository extends JpaRepository<Ruta, Long> {

    @Query("SELECT r FROM Ruta r WHERE r.id_driver = :idDriver")
    Optional<Ruta> findByIdDriver(@Param("idDriver") Long idDriver);

}
