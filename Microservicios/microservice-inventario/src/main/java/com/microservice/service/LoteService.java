package com.microservice.service;

import com.microservice.dto.LoteMateriaPrimaDTO;
import com.microservice.entity.LoteMateriaPrima;
import com.microservice.entity.MateriaPrima;
import com.microservice.repository.LoteMateriaPrimaRepository;
import com.microservice.repository.MateriaPrimaRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LoteService {

    private final LoteMateriaPrimaRepository loteRepository;
    private final MateriaPrimaRepository materiaRepo;

    public LoteService(LoteMateriaPrimaRepository loteRepository, MateriaPrimaRepository materiaRepo) {
        this.loteRepository = loteRepository;
        this.materiaRepo = materiaRepo;
    }

    public LoteMateriaPrimaDTO save(Long materiaId, LoteMateriaPrimaDTO dto) {
        MateriaPrima materia = materiaRepo.findById(materiaId)
                .orElseThrow(() -> new RuntimeException("Materia prima no encontrada con ID: " + materiaId));

        LoteMateriaPrima lote = LoteMateriaPrima.builder()
                .materiaPrimaId(materia.getId())
                .cantidad(dto.getCantidad())
                .costoUnitario(dto.getCostoUnitario())
                .fechaCompra(dto.getFechaCompra())
                .fechaVencimiento(dto.getFechaVencimiento())
                .build();

        LoteMateriaPrima saved = loteRepository.save(lote);
        dto.setId(saved.getId());
        return dto;
    }

    public List<LoteMateriaPrimaDTO> listByMateria(Long materiaId) {
        List<LoteMateriaPrima> lotes = loteRepository.findLotesByMateriaPrimaIdOrderByFechaCompraAsc(materiaId);
        return lotes.stream().map(l -> LoteMateriaPrimaDTO.builder()
                .id(l.getId())
                .materiaPrimaId(l.getMateriaPrimaId())
                .cantidad(l.getCantidad())
                .costoUnitario(l.getCostoUnitario())
                .fechaCompra(l.getFechaCompra())
                .fechaVencimiento(l.getFechaVencimiento())
                .build())
                .collect(Collectors.toList());
    }
}
