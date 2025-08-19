package com.microservice.service;

import com.microservice.dto.ProductoDTO;
import com.microservice.dto.ProductoConRecetaDTO;
import com.microservice.dto.RecetaDTO;
import com.microservice.entity.Producto;
import com.microservice.entity.Receta;
import com.microservice.entity.MateriaPrima;
import com.microservice.repository.ProductoRepository;
import com.microservice.repository.RecetaRepository;
import com.microservice.repository.MateriaPrimaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductoService {

    private final ProductoRepository productoRepo;
    private final RecetaRepository recetaRepo;
    private final MateriaPrimaRepository materiaPrimaRepo;

    public ProductoService(ProductoRepository productoRepo, RecetaRepository recetaRepo, MateriaPrimaRepository materiaPrimaRepo) {
        this.productoRepo = productoRepo;
        this.recetaRepo = recetaRepo;
        this.materiaPrimaRepo = materiaPrimaRepo;
    }

    private ProductoDTO toDTO(Producto entity) {
        // Manejar migración de datos: usar nuevos campos o migrar desde antiguos
        Double cantidadFinal = entity.getCantidad() != null ? entity.getCantidad() : 
                              entity.getStockActual() != null ? entity.getStockActual() : 0.0;
        
        String descripcionFinal = entity.getDescripcion() != null ? entity.getDescripcion() :
                                 entity.getTipo() != null ? entity.getTipo() : "Sin descripción";
        
        return ProductoDTO.builder()
                .id(entity.getId())
                .nombre(entity.getNombre() != null ? entity.getNombre() : "Sin nombre")
                .cantidad(cantidadFinal)
                .precio(entity.getPrecio() != null ? entity.getPrecio() : 0.0)
                .estado(entity.getEstado() != null ? entity.getEstado() : "Disponible")
                .categoria(entity.getCategoria() != null ? entity.getCategoria() : "General")
                .descripcion(descripcionFinal)
                .fecha(entity.getFecha() != null ? entity.getFecha() : LocalDate.now())
                .build();
    }

    public List<ProductoDTO> findAll() {
        return productoRepo.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ProductoDTO save(ProductoDTO dto) {
        Producto producto = Producto.builder()
                .id(dto.getId())
                .nombre(dto.getNombre())
                .cantidad(dto.getCantidad())
                .precio(dto.getPrecio())
                .estado(dto.getEstado())
                .categoria(dto.getCategoria())
                .descripcion(dto.getDescripcion())
                .fecha(dto.getFecha())
                .build();

        return toDTO(productoRepo.save(producto));
    }

    public void delete(Long id) {
        productoRepo.deleteById(id);
    }

    @Transactional
    public ProductoDTO saveConReceta(ProductoConRecetaDTO dto) {
        // 1. Verificar disponibilidad de materias primas
        for (RecetaDTO recetaItem : dto.getReceta()) {
            MateriaPrima materia = materiaPrimaRepo.findById(recetaItem.getMateriaPrimaId())
                .orElseThrow(() -> new RuntimeException("Materia prima no encontrada: " + recetaItem.getMateriaPrimaId()));
            
            // cantidadNecesaria ya viene calculada desde el frontend con el multiplicador aplicado
            Double cantidadNecesaria = recetaItem.getCantidadNecesaria();
            if (materia.getCantidad() < cantidadNecesaria) {
                throw new RuntimeException("Cantidad insuficiente de " + materia.getNombre() + 
                    ". Necesita: " + cantidadNecesaria + ", Disponible: " + materia.getCantidad());
            }
        }

        // 2. Crear el producto
        Producto producto = Producto.builder()
                .nombre(dto.getNombre())
                .cantidad(dto.getCantidad())
                .precio(dto.getPrecio())
                .estado(dto.getEstado())
                .categoria(dto.getCategoria())
                .descripcion(dto.getDescripcion())
                .fecha(dto.getFecha())
                .build();

        producto = productoRepo.save(producto);

        // 3. Guardar la receta
        for (RecetaDTO recetaItem : dto.getReceta()) {
            Receta receta = Receta.builder()
                    .productoId(producto.getId())
                    .materiaPrimaId(recetaItem.getMateriaPrimaId())
                    .cantidadNecesaria(recetaItem.getCantidadNecesaria())
                    .unidad(recetaItem.getUnidad())
                    .build();
            recetaRepo.save(receta);
        }

        // 4. Descontar materias primas
        for (RecetaDTO recetaItem : dto.getReceta()) {
            MateriaPrima materia = materiaPrimaRepo.findById(recetaItem.getMateriaPrimaId()).get();
            // cantidadADescontar ya viene calculada desde el frontend con el multiplicador aplicado
            Double cantidadADescontar = recetaItem.getCantidadNecesaria();
            materia.setCantidad(materia.getCantidad() - cantidadADescontar);
            materiaPrimaRepo.save(materia);
        }

        return toDTO(producto);
    }
}
