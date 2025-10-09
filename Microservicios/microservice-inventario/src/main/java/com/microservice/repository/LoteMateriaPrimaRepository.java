package com.microservice.repository;

import com.microservice.entity.LoteMateriaPrima;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface LoteMateriaPrimaRepository extends JpaRepository<LoteMateriaPrima, Long> {

    @Query(value = "SELECT SUM(l.cantidad * l.costo_unitario) / NULLIF(SUM(l.cantidad),0) FROM lotes_materia_prima l WHERE l.materia_prima_id = :materiaId", nativeQuery = true)
    Double findPppByMateriaPrimaId(@Param("materiaId") Long materiaId);

    @Query(value = "SELECT COALESCE(SUM(l.cantidad),0) FROM lotes_materia_prima l WHERE l.materia_prima_id = :materiaId", nativeQuery = true)
    Double sumCantidadByMateriaPrimaId(@Param("materiaId") Long materiaId);

    @Query(value = "SELECT * FROM lotes_materia_prima l WHERE l.materia_prima_id = :materiaId ORDER BY l.fecha_compra ASC", nativeQuery = true)
    java.util.List<com.microservice.entity.LoteMateriaPrima> findLotesByMateriaPrimaIdOrderByFechaCompraAsc(@Param("materiaId") Long materiaId);
}
