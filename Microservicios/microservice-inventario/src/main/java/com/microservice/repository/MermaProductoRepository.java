package com.microservice.repository;

import com.microservice.entity.MermaProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MermaProductoRepository extends JpaRepository<MermaProducto, Long> {
    
    List<MermaProducto> findAllByOrderByFechaRegistroDesc();
    
    List<MermaProducto> findByProductoIdOrderByFechaRegistroDesc(Long productoId);
    
    List<MermaProducto> findByFechaRegistroBetweenOrderByFechaRegistroDesc(
        LocalDateTime fechaInicio, 
        LocalDateTime fechaFin
    );

    // Método para reportes: buscar mermas por producto y rango de fechas
    List<MermaProducto> findByProductoIdAndFechaRegistroBetween(Long productoId, LocalDateTime fechaInicio, LocalDateTime fechaFin);
}
