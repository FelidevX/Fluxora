package com.microservice.entrega.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.microservice.entrega.entity.RegistroEntrega;

public interface RegistroEntregaRepository extends JpaRepository<RegistroEntrega, Long> {

    @Query("SELECT re FROM RegistroEntrega re WHERE re.id_cliente = :idCliente")
    List<RegistroEntrega> findByIdCliente(@Param("idCliente") Long idCliente);

}
