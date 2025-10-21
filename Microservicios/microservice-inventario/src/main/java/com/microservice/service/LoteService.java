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
                .stockActual(dto.getCantidad()) // stock_actual se inicializa con cantidad
                .costoUnitario(dto.getCostoUnitario())
                .numeroLote(dto.getNumeroLote())
                .fechaCompra(dto.getFechaCompra())
                .fechaVencimiento(dto.getFechaVencimiento())
                .compra(null) // Lote sin compra asociada (compatibilidad legacy)
                .build();

        LoteMateriaPrima saved = loteRepository.save(lote);
        return convertToDTO(saved);
    }

    public List<LoteMateriaPrimaDTO> listByMateria(Long materiaId) {
        List<LoteMateriaPrima> lotes = loteRepository.findLotesByMateriaPrimaIdOrderByFechaCompraAsc(materiaId);
        return lotes.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    private LoteMateriaPrimaDTO convertToDTO(LoteMateriaPrima lote) {
        return LoteMateriaPrimaDTO.builder()
                .id(lote.getId())
                .materiaPrimaId(lote.getMateriaPrimaId())
                .compraId(lote.getCompra() != null ? lote.getCompra().getId() : null)
                .cantidad(lote.getCantidad())
                .stockActual(lote.getStockActual())
                .costoUnitario(lote.getCostoUnitario())
                .numeroLote(lote.getNumeroLote())
                .fechaCompra(lote.getFechaCompra())
                .fechaVencimiento(lote.getFechaVencimiento())
                .build();
    }
}
