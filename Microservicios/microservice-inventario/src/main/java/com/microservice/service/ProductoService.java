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
    private final com.microservice.repository.LoteMateriaPrimaRepository loteRepository;

    public ProductoService(ProductoRepository productoRepo, RecetaRepository recetaRepo, MateriaPrimaRepository materiaPrimaRepo, com.microservice.repository.LoteMateriaPrimaRepository loteRepository) {
        this.productoRepo = productoRepo;
        this.recetaRepo = recetaRepo;
        this.materiaPrimaRepo = materiaPrimaRepo;
        this.loteRepository = loteRepository;
    }

    private ProductoDTO toDTO(Producto entity) {
        // Manejar migración de datos: usar nuevos campos o migrar desde antiguos
        Double cantidadFinal = entity.getCantidad() != null ? entity.getCantidad() : 
                              entity.getStockActual() != null ? entity.getStockActual() : 0.0;
        
        String descripcionFinal = entity.getDescripcion() != null ? entity.getDescripcion() :
                                 entity.getTipo() != null ? entity.getTipo() : "Sin descripción";
        
        // Obtener recetas asociadas al producto
        List<RecetaDTO> recetas = recetaRepo.findByProductoId(entity.getId())
                .stream()
                .map(receta -> {
                    // Obtener el nombre de la materia prima
                    String materiaPrimaNombre = materiaPrimaRepo.findById(receta.getMateriaPrimaId())
                            .map(mp -> mp.getNombre())
                            .orElse("Materia prima no encontrada");
                    
                    return RecetaDTO.builder()
                            .materiaPrimaId(receta.getMateriaPrimaId())
                            .materiaPrimaNombre(materiaPrimaNombre)
                            .cantidadNecesaria(receta.getCantidadNecesaria())
                            .unidad(receta.getUnidad())
                            .build();
                })
                .collect(Collectors.toList());
        
        return ProductoDTO.builder()
                .id(entity.getId())
                .nombre(entity.getNombre() != null ? entity.getNombre() : "Sin nombre")
                .cantidad(cantidadFinal)
                .precio(entity.getPrecio() != null ? entity.getPrecio() : 0.0)
                .estado(entity.getEstado() != null ? entity.getEstado() : "Disponible")
                .categoria(entity.getCategoria() != null ? entity.getCategoria() : "General")
                .descripcion(descripcionFinal)
                .fecha(entity.getFecha() != null ? entity.getFecha() : LocalDate.now())
                .receta(recetas)
                .costoProduccion(entity.getCostoProduccion())
                .ganancia(entity.getGanancia())
                .build();
    }

    public List<ProductoDTO> findAll() {
        return productoRepo.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ProductoDTO save(ProductoDTO dto) {
        // Si vienen datos financieros del frontend, usarlos; si no, calcular
        Double costoProduccion = dto.getCostoProduccion() != null ? dto.getCostoProduccion() : 0.0;
        Double ganancia = dto.getGanancia() != null ? dto.getGanancia() : 
                          (dto.getPrecio() != null ? dto.getPrecio() - costoProduccion : 0.0);
        
        Producto producto = Producto.builder()
                .id(dto.getId())
                .nombre(dto.getNombre())
                .cantidad(dto.getCantidad())
                .precio(dto.getPrecio())
                .estado(dto.getEstado())
                .categoria(dto.getCategoria())
                .descripcion(dto.getDescripcion())
                .fecha(dto.getFecha())
                .costoProduccion(costoProduccion)
                .ganancia(ganancia)
                .build();

        return toDTO(productoRepo.save(producto));
    }

    public void delete(Long id) {
        productoRepo.deleteById(id);
    }

    @Transactional
    public ProductoDTO saveConReceta(ProductoConRecetaDTO dto) {
        // 1. Verificar disponibilidad de materias primas y calcular costo de producción
        Double costoProduccion = 0.0;
        
        for (RecetaDTO recetaItem : dto.getReceta()) {
            MateriaPrima materia = materiaPrimaRepo.findById(recetaItem.getMateriaPrimaId())
                .orElseThrow(() -> new RuntimeException("Materia prima no encontrada: " + recetaItem.getMateriaPrimaId()));
            
            // cantidadNecesaria ya viene calculada desde el frontend con el multiplicador aplicado
            Double cantidadNecesaria = recetaItem.getCantidadNecesaria();
            // Obtener disponibilidad desde lotes
            Double disponible = loteRepository.sumCantidadByMateriaPrimaId(recetaItem.getMateriaPrimaId());
            if (disponible == null) disponible = 0.0;
            if (disponible < cantidadNecesaria) {
                throw new RuntimeException("Cantidad insuficiente de " + materia.getNombre() + 
                    ". Necesita: " + cantidadNecesaria + ", Disponible: " + disponible);
            }
            
            // Calcular costo usando PPP (Precio Promedio Ponderado)
            Double ppp = loteRepository.findPppByMateriaPrimaId(recetaItem.getMateriaPrimaId());
            if (ppp == null) ppp = 0.0;
            costoProduccion += cantidadNecesaria * ppp;
        }

        // 2. Calcular ganancia
        Double precio = dto.getPrecio() != null ? dto.getPrecio() : 0.0;
        Double ganancia = precio - costoProduccion;

        // 3. Crear el producto con datos financieros
        Producto producto = Producto.builder()
                .nombre(dto.getNombre())
                .cantidad(dto.getCantidad())
                .precio(precio)
                .estado(dto.getEstado())
                .categoria(dto.getCategoria())
                .descripcion(dto.getDescripcion())
                .fecha(dto.getFecha())
                .costoProduccion(costoProduccion)
                .ganancia(ganancia)
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
            // Para descontar stock debemos consumir lotes (FIFO). Por ahora lanzamos excepción si no hay lógica de consumo.
            Double cantidadADescontar = recetaItem.getCantidadNecesaria();
            Double disponible = loteRepository.sumCantidadByMateriaPrimaId(recetaItem.getMateriaPrimaId());
            if (disponible == null) disponible = 0.0;
            if (disponible < cantidadADescontar) {
                throw new RuntimeException("Error de stock al descontar materia prima: cantidad insuficiente");
            }
            // Implementar consumo de lotes (restar cantidades a lotes existentes, FIFO)
            Double restante = cantidadADescontar;
            java.util.List<com.microservice.entity.LoteMateriaPrima> lotes = loteRepository.findLotesByMateriaPrimaIdOrderByFechaCompraAsc(recetaItem.getMateriaPrimaId());
            for (com.microservice.entity.LoteMateriaPrima lote : lotes) {
                if (restante <= 0) break;
                Double disponibleEnLote = lote.getCantidad() != null ? lote.getCantidad() : 0.0;
                if (disponibleEnLote <= 0) continue;

                if (disponibleEnLote >= restante) {
                    // consumir lo necesario y actualizar lote
                    lote.setCantidad(disponibleEnLote - restante);
                    loteRepository.save(lote);
                    restante = 0.0;
                    break;
                } else {
                    // consumir todo el lote y seguir
                    restante = restante - disponibleEnLote;
                    lote.setCantidad(0.0);
                    loteRepository.save(lote);
                }
            }

            if (restante > 0) {
                // Esto no debería pasar porque validamos disponibilidad antes, pero por seguridad lanzamos excepción
                throw new RuntimeException("Error de stock al descontar materia prima: cantidad insuficiente tras consumir lotes");
            }
        }

        return toDTO(producto);
    }

    public ProductoDTO updateStock(Long id, int nuevaCantidad) {
        Producto producto = productoRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        
        // Calcular cantidad a agregar (puede ser positiva o negativa)
        Double cantidadActual = producto.getCantidad() != null ? producto.getCantidad() : 
                                producto.getStockActual() != null ? producto.getStockActual() : 0.0;
        
        Double cantidadFinal = cantidadActual + nuevaCantidad;
        
        // Actualizar cantidad
        producto.setCantidad(cantidadFinal);
        if (producto.getStockActual() != null) {
            producto.setStockActual(cantidadFinal);
        }
        
        producto = productoRepo.save(producto);
        return toDTO(producto);
    }
}
