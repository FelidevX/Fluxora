package com.microservice.entrega.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.microservice.entrega.entity.RegistroEntrega;

public interface RegistroEntregaRepository extends JpaRepository<RegistroEntrega, Long> {

    @Query("SELECT re FROM RegistroEntrega re WHERE re.id_cliente = :idCliente")
    List<RegistroEntrega> findByIdCliente(@Param("idCliente") Long idCliente);

    @Modifying
    @Query("DELETE FROM RegistroEntrega re WHERE re.id_cliente = :idCliente")
    void deleteByIdCliente(@Param("idCliente") Long idCliente);

    @Query("SELECT re FROM RegistroEntrega re WHERE re.id_pedido = :idPedido")
    List<RegistroEntrega> findByIdPedido(@Param("idPedido") Long idPedido);

    @Query("SELECT re FROM RegistroEntrega re WHERE re.id_pedido = :idPedido AND re.id_cliente = :idCliente")
    Optional<RegistroEntrega> findByIdPedidoAndIdCliente(@Param("idPedido") Long idPedido,
            @Param("idCliente") Long idCliente);

    @Query(value = "SELECT COUNT(*) FROM registro_entrega WHERE DATE(hora_entregada) = :fecha", nativeQuery = true)
    Long countByFecha(@Param("fecha") LocalDate fecha);

    @Query(value = "SELECT DATE(hora_entregada) as fecha, COUNT(*) as total FROM registro_entrega WHERE hora_entregada BETWEEN :fechaInicio AND :fechaFin GROUP BY DATE(hora_entregada) ORDER BY DATE(hora_entregada)", nativeQuery = true)
    List<Object[]> countEntregasPorDia(@Param("fechaInicio") LocalDateTime fechaInicio, @Param("fechaFin") LocalDateTime fechaFin);

}
