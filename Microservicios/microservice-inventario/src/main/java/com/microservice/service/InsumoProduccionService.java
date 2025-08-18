package com.microservice.service;

import com.microservice.dto.InsumoProduccionDTO;
import com.microservice.entity.InsumoProduccion;
import com.microservice.repository.InsumoProduccionRepository;
import com.microservice.repository.MateriaPrimaRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class InsumoProduccionService {

    private final InsumoProduccionRepository insumoRepo;
    private final MateriaPrimaRepository materiaRepo;

    public InsumoProduccionService(InsumoProduccionRepository insumoRepo, MateriaPrimaRepository materiaRepo) {
        this.insumoRepo = insumoRepo;
        this.materiaRepo = materiaRepo;
    }

    private InsumoProduccionDTO toDTO(InsumoProduccion entity) {
        return InsumoProduccionDTO.builder()
                .id(entity.getId())
                .cantidadUsada(entity.getCantidadUsada())
                .fecha(entity.getFecha())
                .materiaPrimaId(entity.getMateriaPrima().getId())
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
                .materiaPrima(materiaRepo.findById(dto.getMateriaPrimaId()).orElseThrow())
                .build();
        return toDTO(insumoRepo.save(entity));
    }

    public void delete(Long id) {
        insumoRepo.deleteById(id);
    }
}
