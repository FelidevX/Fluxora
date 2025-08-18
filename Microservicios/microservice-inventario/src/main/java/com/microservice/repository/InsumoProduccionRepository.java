package com.microservice.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.microservice.entity.InsumoProduccion;

@Repository
public interface InsumoProduccionRepository extends JpaRepository<InsumoProduccion, Long> {
    Optional<InsumoProduccion> findById(Long id);
}
