package com.microservice.service;

import com.microservice.dto.ProductoDTO;
import com.microservice.entity.Producto;
import com.microservice.repository.ProductoRepository;
import com.microservice.repository.MateriaPrimaRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductoService {

    private final ProductoRepository productoRepo;
    private final MateriaPrimaRepository materiaRepo;

    public ProductoService(ProductoRepository productoRepo, MateriaPrimaRepository materiaRepo) {
        this.productoRepo = productoRepo;
        this.materiaRepo = materiaRepo;
    }

    private ProductoDTO toDTO(Producto entity) {
        return ProductoDTO.builder()
                .id(entity.getId())
                .nombre(entity.getNombre())
                .tipo(entity.getTipo())
                .stockActual(entity.getStockActual())
                .estado(entity.getEstado())
                .fecha(entity.getFecha())
                .materiasPrimasIds(
                        entity.getMateriasPrimas().stream().map(mp -> mp.getId()).collect(Collectors.toList())
                )
                .build();
    }

    public List<ProductoDTO> findAll() {
        return productoRepo.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ProductoDTO save(ProductoDTO dto) {
        Producto producto = Producto.builder()
                .id(dto.getId())
                .nombre(dto.getNombre())
                .tipo(dto.getTipo())
                .stockActual(dto.getStockActual())
                .estado(dto.getEstado())
                .fecha(dto.getFecha())
                .materiasPrimas(materiaRepo.findAllById(dto.getMateriasPrimasIds()))
                .build();

        return toDTO(productoRepo.save(producto));
    }

    public void delete(Long id) {
        productoRepo.deleteById(id);
    }
}
