package com.microservice.entrega.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.microservice.entrega.entity.RutaCliente;

public interface RutaClienteRepository extends JpaRepository<RutaCliente, Long> {

    @Query("SELECT DISTINCT rc.id_cliente FROM RutaCliente rc")
    List<Long> findAllClienteIds();

    @Query("SELECT rc FROM RutaCliente rc WHERE rc.id_ruta = :idRuta")
    List<RutaCliente> findByIdRuta(@Param("idRuta") Long idRuta);

}
