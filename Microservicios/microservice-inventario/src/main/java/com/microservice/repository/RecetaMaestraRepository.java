package com.microservice.repository;

import com.microservice.entity.RecetaMaestra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RecetaMaestraRepository extends JpaRepository<RecetaMaestra, Long> {
    List<RecetaMaestra> findByActivaTrue();
    List<RecetaMaestra> findByCategoria(String categoria);
    List<RecetaMaestra> findByNombreContainingIgnoreCase(String nombre);
}