package com.microservice.entrega.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.microservice.entrega.entity.ProgramacionEntrega;

public interface ProgramacionEntregaRepository extends JpaRepository<ProgramacionEntrega, Long> {

    @Query("SELECT pe FROM ProgramacionEntrega pe WHERE pe.fecha_programada = :fecha")
    List<ProgramacionEntrega> findByFechaProgramada(@Param("fecha") LocalDate fecha);

    @Modifying
    @Query("DELETE FROM ProgramacionEntrega pe WHERE pe.id_cliente = :idCliente")
    void deleteByIdCliente(@Param("idCliente") Long idCliente);

    @Query("SELECT pe FROM ProgramacionEntrega pe WHERE pe.id_ruta = :idRuta AND pe.fecha_programada = :fecha")
    List<ProgramacionEntrega> findByIdRutaAndFechaProgramada(@Param("idRuta") Long idRuta, @Param("fecha") LocalDate fecha);

    @Query("SELECT pe FROM ProgramacionEntrega pe WHERE pe.id_ruta = :idRuta AND pe.id_cliente = :idCliente AND pe.fecha_programada = :fecha")
    List<ProgramacionEntrega> findByIdRutaAndIdClienteAndFechaProgramada(@Param("idRuta") Long idRuta, @Param("idCliente") Long idCliente, @Param("fecha") LocalDate fecha);

    @Query("SELECT pe FROM ProgramacionEntrega pe WHERE pe.id_ruta = :idRuta AND pe.id_cliente = :idCliente AND pe.fecha_programada < :fecha ORDER BY pe.fecha_programada DESC")
    List<ProgramacionEntrega> findProgramacionAnterior(@Param("idRuta") Long idRuta, @Param("idCliente") Long idCliente, @Param("fecha") LocalDate fecha);

    @Query("SELECT pe FROM ProgramacionEntrega pe WHERE pe.id_ruta = :idRuta")
    List<ProgramacionEntrega> findByIdRuta(@Param("idRuta") Long idRuta);
}