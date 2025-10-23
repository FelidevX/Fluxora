package com.microservice.entrega.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.microservice.entrega.entity.RutaCliente;

public interface RutaClienteRepository extends JpaRepository<RutaCliente, Long> {

    @Query("SELECT DISTINCT rc.id_cliente FROM RutaCliente rc")
    List<Long> findAllClienteIds();

    @Modifying
    @Query("DELETE FROM RutaCliente rc WHERE rc.id_cliente = :idCliente")
    void deleteByIdCliente(@Param("idCliente") Long idCliente);

    @Query("SELECT rc FROM RutaCliente rc WHERE rc.id_ruta = :idRuta")
    List<RutaCliente> findByIdRuta(@Param("idRuta") Long idRuta);


    @Query("SELECT rc FROM RutaCliente rc WHERE rc.id_ruta =:idRuta")
    List<RutaCliente> findById_ruta(@Param("idRuta") Long idRuta);

    // Nuevos métodos para trabajar con fechas programadas - usando @Query para evitar problemas con snake_case
    @Query("SELECT rc FROM RutaCliente rc WHERE rc.fecha_programada = :fecha")
    List<RutaCliente> findByFechaProgramada(@Param("fecha") LocalDate fecha);
    
    @Query("SELECT rc FROM RutaCliente rc WHERE rc.id_ruta = :idRuta AND rc.fecha_programada = :fecha")
    List<RutaCliente> findByIdRutaAndFechaProgramada(@Param("idRuta") Long idRuta, @Param("fecha") LocalDate fecha);
    
    @Query("SELECT rc FROM RutaCliente rc WHERE rc.id_ruta = :idRuta AND rc.id_cliente = :idCliente AND rc.fecha_programada = :fecha")
    Optional<RutaCliente> findByIdRutaAndIdClienteAndFechaProgramada(@Param("idRuta") Long idRuta, @Param("idCliente") Long idCliente, @Param("fecha") LocalDate fecha);
    
    // Buscar relación ruta-cliente base (sin fecha específica) 
    @Query("SELECT rc FROM RutaCliente rc WHERE rc.id_ruta = :idRuta AND rc.id_cliente = :idCliente")
    List<RutaCliente> findByIdRutaAndIdCliente(@Param("idRuta") Long idRuta, @Param("idCliente") Long idCliente);
    
    // Buscar programaciones del día anterior para obtener valores por defecto
    @Query("SELECT rc FROM RutaCliente rc WHERE rc.id_ruta = :idRuta AND rc.id_cliente = :idCliente AND rc.fecha_programada < :fecha ORDER BY rc.fecha_programada DESC")
    Optional<RutaCliente> findTopByIdRutaAndIdClienteAndFechaProgramadaLessThanOrderByFechaProgramadaDesc(@Param("idRuta") Long idRuta, @Param("idCliente") Long idCliente, @Param("fecha") LocalDate fecha);

}
