package com.microservice.service;

import com.microservice.dto.ProductoDTO;
import com.microservice.entity.Producto;
import com.microservice.entity.RecetaMaestra;
import com.microservice.repository.ProductoRepository;
import com.microservice.repository.LoteProductoRepository;
import com.microservice.repository.RecetaMaestraRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductoService {

    private final ProductoRepository productoRepo;
    private final LoteProductoRepository loteProductoRepository;
    private final RecetaMaestraRepository recetaMaestraRepository;

    public ProductoService(ProductoRepository productoRepo, 
                          LoteProductoRepository loteProductoRepository,
                          RecetaMaestraRepository recetaMaestraRepository) {
        this.productoRepo = productoRepo;
        this.loteProductoRepository = loteProductoRepository;
        this.recetaMaestraRepository = recetaMaestraRepository;
    }

    private ProductoDTO toDTO(Producto entity) {
        // Calcular stock total desde los lotes
        Integer stockTotal = loteProductoRepository.sumStockActualByProductoId(entity.getId());
        
        return ProductoDTO.builder()
                .id(entity.getId())
                .nombre(entity.getNombre())
                .estado(entity.getEstado())
                .precioVenta(entity.getPrecioVenta())
                .tipoProducto(entity.getTipoProducto() != null ? entity.getTipoProducto().name() : null)
                .categoria(entity.getCategoria())
                .recetaMaestraId(entity.getRecetaMaestra() != null ? entity.getRecetaMaestra().getId() : null)
                .stockTotal(stockTotal != null ? stockTotal : 0)
                .build();
    }

    public List<ProductoDTO> findAll() {
        return productoRepo.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ProductoDTO findById(Long id) {
        Producto producto = productoRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con ID: " + id));
        return toDTO(producto);
    }

    public ProductoDTO save(ProductoDTO dto) {
        // Convertir String a Enum si viene del frontend
        Producto.TipoProducto tipoProductoEnum = null;
        if (dto.getTipoProducto() != null) {
            try {
                tipoProductoEnum = Producto.TipoProducto.valueOf(dto.getTipoProducto());
            } catch (IllegalArgumentException e) {
                tipoProductoEnum = Producto.TipoProducto.NO_APLICA;
            }
        }

        // Buscar receta si se proporciona ID
        RecetaMaestra recetaMaestra = null;
        if (dto.getRecetaMaestraId() != null) {
            recetaMaestra = recetaMaestraRepository.findById(dto.getRecetaMaestraId())
                    .orElse(null);
        }

        Producto producto = Producto.builder()
                .id(dto.getId())
                .nombre(dto.getNombre())
                .estado(dto.getEstado())
                .precioVenta(dto.getPrecioVenta())
                .tipoProducto(tipoProductoEnum)
                .categoria(dto.getCategoria())
                .recetaMaestra(recetaMaestra)
                .build();

        return toDTO(productoRepo.save(producto));
    }

    public ProductoDTO update(Long id, ProductoDTO dto) {
        Producto producto = productoRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con ID: " + id));

        if (dto.getNombre() != null) {
            producto.setNombre(dto.getNombre());
        }
        if (dto.getEstado() != null) {
            producto.setEstado(dto.getEstado());
        }
        if (dto.getPrecioVenta() != null) {
            producto.setPrecioVenta(dto.getPrecioVenta());
        }
        if (dto.getTipoProducto() != null) {
            try {
                producto.setTipoProducto(Producto.TipoProducto.valueOf(dto.getTipoProducto()));
            } catch (IllegalArgumentException e) {
                producto.setTipoProducto(Producto.TipoProducto.NO_APLICA);
            }
        }
        if (dto.getCategoria() != null) {
            producto.setCategoria(dto.getCategoria());
        }

        return toDTO(productoRepo.save(producto));
    }

    public void delete(Long id) {
        productoRepo.deleteById(id);
    }
}
