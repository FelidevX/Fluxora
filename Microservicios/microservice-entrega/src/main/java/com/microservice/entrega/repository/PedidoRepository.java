package com.microservice.entrega.repository;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.microservice.entrega.entity.Pedido;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    @Query("SELECT p FROM Pedido p WHERE p.id_driver = :idDriver AND CAST(p.fecha AS date) = :fecha")
    Optional<Pedido> findByIdDriverAndFecha(@Param("idDriver") Long idDriver, @Param("fecha") LocalDate fecha);
}
