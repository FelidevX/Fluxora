package com.microservice.repository;

import com.microservice.entity.RecetaIngrediente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RecetaIngredienteRepository extends JpaRepository<RecetaIngrediente, Long> {
    List<RecetaIngrediente> findByRecetaMaestraId(Long recetaMaestraId);
    List<RecetaIngrediente> findByMateriaPrimaId(Long materiaPrimaId);
    void deleteByRecetaMaestraId(Long recetaMaestraId);
}