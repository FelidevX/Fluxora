package com.microservice.repository;

import com.microservice.entity.LoteMateriaPrima;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface LoteMateriaPrimaRepository extends JpaRepository<LoteMateriaPrima, Long> {

    // PPP: Sigue usando CANTIDAD (cantidad original comprada)
    @Query(value = "SELECT SUM(l.cantidad * l.costo_unitario) / NULLIF(SUM(l.cantidad),0) FROM lotes_materia_prima l WHERE l.materia_prima_id = :materiaId", nativeQuery = true)
    Double findPppByMateriaPrimaId(@Param("materiaId") Long materiaId);

    // STOCK: Ahora usa STOCK_ACTUAL (cantidad disponible)
    @Query(value = "SELECT COALESCE(SUM(l.stock_actual),0) FROM lotes_materia_prima l WHERE l.materia_prima_id = :materiaId", nativeQuery = true)
    Double sumStockActualByMateriaPrimaId(@Param("materiaId") Long materiaId);

    // DEPRECATED: Mantener para compatibilidad temporal (usar sumStockActualByMateriaPrimaId)
    @Query(value = "SELECT COALESCE(SUM(l.stock_actual),0) FROM lotes_materia_prima l WHERE l.materia_prima_id = :materiaId", nativeQuery = true)
    Double sumCantidadByMateriaPrimaId(@Param("materiaId") Long materiaId);

    @Query(value = "SELECT * FROM lotes_materia_prima l WHERE l.materia_prima_id = :materiaId ORDER BY l.fecha_compra ASC", nativeQuery = true)
    java.util.List<com.microservice.entity.LoteMateriaPrima> findLotesByMateriaPrimaIdOrderByFechaCompraAsc(@Param("materiaId") Long materiaId);

    // Buscar lotes por compra
    @Query(value = "SELECT * FROM lotes_materia_prima l WHERE l.compra_id = :compraId ORDER BY l.fecha_compra ASC", nativeQuery = true)
    java.util.List<com.microservice.entity.LoteMateriaPrima> findLotesByCompraId(@Param("compraId") Long compraId);

    // Buscar lotes con stock disponible (FIFO)
    @Query(value = "SELECT * FROM lotes_materia_prima l WHERE l.materia_prima_id = :materiaId AND l.stock_actual > 0 ORDER BY l.fecha_compra ASC", nativeQuery = true)
    java.util.List<com.microservice.entity.LoteMateriaPrima> findLotesDisponiblesByMateriaPrimaId(@Param("materiaId") Long materiaId);
}

