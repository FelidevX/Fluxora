package com.microservice.service;

import com.microservice.dto.MateriaPrimaDTO;
import com.microservice.entity.MateriaPrima;
import com.microservice.repository.MateriaPrimaRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MateriaPrimaService {

    private final MateriaPrimaRepository repository;

    public MateriaPrimaService(MateriaPrimaRepository repository) {
        this.repository = repository;
    }

    private MateriaPrimaDTO toDTO(MateriaPrima entity) {
        return MateriaPrimaDTO.builder()
                .id(entity.getId())
                .nombre(entity.getNombre())
                .cantidad(entity.getCantidad())
                .proveedor(entity.getProveedor())
                .estado(entity.getEstado())
                .unidad(entity.getUnidad())
                .fecha(entity.getFecha())
                .build();
    }

    private MateriaPrima toEntity(MateriaPrimaDTO dto) {
        return MateriaPrima.builder()
                .id(dto.getId())
                .nombre(dto.getNombre())
                .cantidad(dto.getCantidad())
                .proveedor(dto.getProveedor())
                .estado(dto.getEstado())
                .unidad(dto.getUnidad())
                .fecha(dto.getFecha())
                .build();
    }

    public List<MateriaPrimaDTO> findAll() {
        return repository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public MateriaPrimaDTO save(MateriaPrimaDTO dto) {
        MateriaPrima entity = repository.save(toEntity(dto));
        return toDTO(entity);
    }

    public MateriaPrimaDTO actualizarStock(Long id, Double nuevaCantidad) {
        MateriaPrima entity = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Materia prima no encontrada con ID: " + id));
        
        entity.setCantidad(nuevaCantidad);
        MateriaPrima updated = repository.save(entity);
        return toDTO(updated);
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
