package com.microservice.repository;

import com.microservice.entity.LoteProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoteProductoRepository extends JpaRepository<LoteProducto, Long> {

    @Query(value = "SELECT COALESCE(SUM(l.stock_actual),0) FROM lotes_producto l WHERE l.producto_id = :productoId", nativeQuery = true)
    Integer sumStockActualByProductoId(@Param("productoId") Long productoId);

    @Query(value = "SELECT * FROM lotes_producto l WHERE l.producto_id = :productoId ORDER BY l.fecha_produccion DESC", nativeQuery = true)
    List<LoteProducto> findLotesByProductoIdOrderByFechaProduccionDesc(@Param("productoId") Long productoId);

    @Query(value = "SELECT * FROM lotes_producto l WHERE l.producto_id = :productoId ORDER BY l.fecha_vencimiento ASC", nativeQuery = true)
    List<LoteProducto> findLotesByProductoIdOrderByFechaVencimientoAsc(@Param("productoId") Long productoId);

    @Query(value = "SELECT * FROM lotes_producto l WHERE l.producto_id = :productoId AND l.stock_actual > 0 ORDER BY l.fecha_vencimiento ASC", nativeQuery = true)
    List<LoteProducto> findLotesDisponiblesByProductoIdOrderByFechaVencimientoAsc(@Param("productoId") Long productoId);
}
