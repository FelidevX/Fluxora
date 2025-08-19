package com.microservice.service;

import com.microservice.dto.InsumoProduccionDTO;
import com.microservice.entity.InsumoProduccion;
import com.microservice.repository.InsumoProduccionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class InsumoProduccionService {

    private final InsumoProduccionRepository insumoRepo;

    public InsumoProduccionService(InsumoProduccionRepository insumoRepo) {
        this.insumoRepo = insumoRepo;
    }

    private InsumoProduccionDTO toDTO(InsumoProduccion entity) {
        return InsumoProduccionDTO.builder()
                .id(entity.getId())
                .cantidadUsada(entity.getCantidadUsada())
                .fecha(entity.getFecha())
                .materiaPrimaId(entity.getMateriaPrimaId())
                .build();
    }

    public List<InsumoProduccionDTO> findAll() {
        return insumoRepo.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public InsumoProduccionDTO save(InsumoProduccionDTO dto) {
        InsumoProduccion entity = InsumoProduccion.builder()
                .id(dto.getId())
                .cantidadUsada(dto.getCantidadUsada())
                .fecha(dto.getFecha())
                .materiaPrimaId(dto.getMateriaPrimaId())
                .build();
        return toDTO(insumoRepo.save(entity));
    }

    public void delete(Long id) {
        insumoRepo.deleteById(id);
    }
}
