package com.microservice.repository;

import com.microservice.entity.CompraMateriaPrima;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CompraMateriaPrimaRepository extends JpaRepository<CompraMateriaPrima, Long> {

    // Buscar compras por proveedor
    List<CompraMateriaPrima> findByProveedorContainingIgnoreCase(String proveedor);

    // Buscar compras por número de documento
    List<CompraMateriaPrima> findByNumDoc(String numDoc);

    // Buscar compras por rango de fechas
    List<CompraMateriaPrima> findByFechaCompraBetween(LocalDate fechaInicio, LocalDate fechaFin);

    // Buscar compras ordenadas por fecha descendente
    List<CompraMateriaPrima> findAllByOrderByFechaCompraDesc();

    // Obtener compras recientes (últimos N días)
    @Query("SELECT c FROM CompraMateriaPrima c WHERE c.fechaCompra >= :fechaDesde ORDER BY c.fechaCompra DESC")
    List<CompraMateriaPrima> findComprasRecientes(@Param("fechaDesde") LocalDate fechaDesde);
}
