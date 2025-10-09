package com.microservice.service;

import com.microservice.dto.MateriaPrimaDTO;
import com.microservice.entity.MateriaPrima;
import com.microservice.repository.MateriaPrimaRepository;
import com.microservice.repository.LoteMateriaPrimaRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MateriaPrimaService {

    private final MateriaPrimaRepository repository;

    private final LoteMateriaPrimaRepository loteRepository;

    public MateriaPrimaService(MateriaPrimaRepository repository, LoteMateriaPrimaRepository loteRepository) {
        this.repository = repository;
        this.loteRepository = loteRepository;
    }

    private MateriaPrimaDTO toDTO(MateriaPrima entity) {
        return MateriaPrimaDTO.builder()
                .id(entity.getId())
                .nombre(entity.getNombre())
                // cantidad/stock ahora se calcula como la suma de lotes
                .unidad(entity.getUnidad())
                .build();
    }

    private MateriaPrima toEntity(MateriaPrimaDTO dto) {
        return MateriaPrima.builder()
                .id(dto.getId())
                .nombre(dto.getNombre())
                .unidad(dto.getUnidad())
                .build();
    }

    public List<MateriaPrimaDTO> findAll() {
        return repository.findAll().stream()
                .map(entity -> {
                    MateriaPrimaDTO dto = toDTO(entity);
                    // calcular stock actual como suma de lotes
                    Double totalCantidad = loteRepository.sumCantidadByMateriaPrimaId(entity.getId());
                    dto.setCantidad(totalCantidad == null ? 0.0 : totalCantidad);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public MateriaPrimaDTO save(MateriaPrimaDTO dto) {
        MateriaPrima entity = repository.save(toEntity(dto));
        return toDTO(entity);
    }

    public MateriaPrimaDTO actualizarStock(Long id, Double nuevaCantidad) {
        Double totalCantidad = loteRepository.sumCantidadByMateriaPrimaId(id);
        MateriaPrima entity = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Materia prima no encontrada con ID: " + id));

        MateriaPrimaDTO dto = toDTO(entity);
        dto.setCantidad(totalCantidad == null ? 0.0 : totalCantidad);
        return dto;
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    // Método para encontrar materias por nombre (para el utilitario de reparación)
    public List<MateriaPrimaDTO> findByNombre(String nombre) {
        return repository.findAll().stream()
                .filter(materia -> materia.getNombre().equalsIgnoreCase(nombre))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}
