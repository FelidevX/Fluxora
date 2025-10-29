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

    @Query(value = "SELECT COALESCE(SUM(re.corriente_entregado + re.especial_entregado),0) FROM registro_entrega re WHERE DATE(re.hora_entregada) = :fecha", nativeQuery = true)
    Double sumKilosByFecha(@Param("fecha") LocalDate fecha);

    // Queries para reporte de entregas
    @Query(value = "SELECT DATE(re.hora_entregada) as fecha, " +
            "COUNT(*) as totalEntregas, " +
            "COALESCE(SUM(re.corriente_entregado), 0) as kgCorriente, " +
            "COALESCE(SUM(re.especial_entregado), 0) as kgEspecial " +
            "FROM registro_entrega re " +
            "WHERE DATE(re.hora_entregada) BETWEEN :fechaInicio AND :fechaFin " +
            "GROUP BY DATE(re.hora_entregada) " +
            "ORDER BY DATE(re.hora_entregada)", nativeQuery = true)
    List<Object[]> obtenerReporteEntregas(@Param("fechaInicio") LocalDate fechaInicio, 
                                           @Param("fechaFin") LocalDate fechaFin);

    @Query(value = "SELECT DATE(re.hora_entregada) as fecha, " +
            "COUNT(*) as totalEntregas, " +
            "COALESCE(SUM(re.corriente_entregado), 0) as kgCorriente, " +
            "COALESCE(SUM(re.especial_entregado), 0) as kgEspecial " +
            "FROM registro_entrega re " +
            "INNER JOIN programacion_entrega pe ON re.id_cliente = pe.id_cliente " +
            "INNER JOIN ruta r ON pe.id_ruta = r.id " +
            "WHERE DATE(re.hora_entregada) BETWEEN :fechaInicio AND :fechaFin " +
            "AND r.id = :idRuta " +
            "GROUP BY DATE(re.hora_entregada) " +
            "ORDER BY DATE(re.hora_entregada)", nativeQuery = true)
    List<Object[]> obtenerReporteEntregasPorRuta(@Param("fechaInicio") LocalDate fechaInicio, 
                                                   @Param("fechaFin") LocalDate fechaFin,
                                                   @Param("idRuta") Long idRuta);

    // Queries para reporte de ventas
    @Query(value = "SELECT DATE(re.hora_entregada) as fecha, " +
            "COALESCE(SUM(re.monto_total), 0) as totalVentas, " +
            "COALESCE(SUM(re.corriente_entregado + re.especial_entregado), 0) as totalKilos, " +
            "COALESCE(SUM(re.monto_corriente), 0) as ventasCorriente, " +
            "COALESCE(SUM(re.monto_especial), 0) as ventasEspecial, " +
            "COUNT(DISTINCT re.id_cliente) as numeroClientes " +
            "FROM registro_entrega re " +
            "WHERE DATE(re.hora_entregada) BETWEEN :fechaInicio AND :fechaFin " +
            "GROUP BY DATE(re.hora_entregada) " +
            "ORDER BY DATE(re.hora_entregada)", nativeQuery = true)
    List<Object[]> obtenerReporteVentas(@Param("fechaInicio") LocalDate fechaInicio, 
                                         @Param("fechaFin") LocalDate fechaFin);
}
