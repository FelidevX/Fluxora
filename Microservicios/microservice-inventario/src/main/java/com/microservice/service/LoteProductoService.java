package com.microservice.service;

import com.microservice.dto.LoteConProductoDTO;
import com.microservice.dto.LoteProductoDTO;
import com.microservice.dto.StockDisponibleDTO;
import com.microservice.entity.LoteProducto;
import com.microservice.entity.Producto;
import com.microservice.entity.LoteMateriaPrima;
import com.microservice.entity.RecetaMaestra;
import com.microservice.exception.BusinessRuleException;
import com.microservice.exception.RecursoNoEncontradoException;
import com.microservice.repository.LoteProductoRepository;
import com.microservice.repository.ProductoRepository;
import com.microservice.repository.LoteMateriaPrimaRepository;
import com.microservice.repository.MateriaPrimaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Service
public class LoteProductoService {

    private final LoteProductoRepository loteProductoRepository;
    private final ProductoRepository productoRepository;
    private final LoteMateriaPrimaRepository loteMateriaPrimaRepository;
    private final MateriaPrimaRepository materiaPrimaRepository;

    public LoteProductoService(
            LoteProductoRepository loteProductoRepository, 
            ProductoRepository productoRepository,
            LoteMateriaPrimaRepository loteMateriaPrimaRepository,
            MateriaPrimaRepository materiaPrimaRepository) {
        this.loteProductoRepository = loteProductoRepository;
        this.productoRepository = productoRepository;
        this.loteMateriaPrimaRepository = loteMateriaPrimaRepository;
        this.materiaPrimaRepository = materiaPrimaRepository;
    }

    @Transactional
    public LoteProductoDTO save(Long productoId, LoteProductoDTO dto) {
        // 1. Validar que el producto existe (404)
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                    "Producto no encontrado con ID: " + productoId));

        // 2. Validar que tiene receta (Lógica de negocio - 409)
        RecetaMaestra receta = producto.getRecetaMaestra();
        if (receta == null) {
            throw new BusinessRuleException(
                "RECETA_NO_ENCONTRADA",
                "El producto '" + producto.getNombre() + "' no tiene una receta asociada. Por favor, asigne una receta antes de crear el lote."
            );
        }

        // 3. Si hay receta, validar y descontar stock de materias primas usando FEFO
        if (dto.getCantidadProducida() != null) {
            // Calcular el multiplicador basado en la cantidad producida
            double multiplicador = dto.getCantidadProducida() / receta.getCantidadBase();

            // Lista para acumular ingredientes con stock insuficiente
            List<Map<String, Object>> ingredientesFaltantes = new ArrayList<>();

            // Validar cada ingrediente ANTES de descontar
            receta.getIngredientes().forEach(ingrediente -> {
                Long materiaPrimaId = ingrediente.getMateriaPrimaId();
                Double cantidadNecesaria = ingrediente.getCantidadNecesaria() * multiplicador;

                // Obtener lotes disponibles ordenados por fecha de vencimiento (FEFO)
                List<LoteMateriaPrima> lotesDisponibles = loteMateriaPrimaRepository
                        .findLotesByMateriaPrimaIdOrderByFechaVencimientoAsc(materiaPrimaId);
                
                // Filtrar solo los que tienen stock disponible
                lotesDisponibles = lotesDisponibles.stream()
                        .filter(lote -> lote.getStockActual() > 0)
                        .collect(Collectors.toList());

                // Calcular stock total disponible
                double stockTotal = lotesDisponibles.stream()
                        .mapToDouble(LoteMateriaPrima::getStockActual)
                        .sum();

                // Obtener información de la materia prima
                var materiaPrima = materiaPrimaRepository.findById(materiaPrimaId).orElse(null);
                String nombreMateria = materiaPrima != null ? materiaPrima.getNombre() : "ID " + materiaPrimaId;
                String unidad = materiaPrima != null ? materiaPrima.getUnidad() : "";

                // Si no hay suficiente stock, agregar a la lista de faltantes
                if (stockTotal < cantidadNecesaria) {
                    ingredientesFaltantes.add(Map.of(
                        "materiaPrima", nombreMateria,
                        "necesario", cantidadNecesaria,
                        "disponible", stockTotal,
                        "unidad", unidad
                    ));
                }
            });

            // Si hay ingredientes faltantes, lanzar excepción con detalles
            if (!ingredientesFaltantes.isEmpty()) {
                // Construir mensaje descriptivo
                StringBuilder mensaje = new StringBuilder("Stock insuficiente para crear el lote:");
                ingredientesFaltantes.forEach(faltante -> {
                    mensaje.append(String.format(
                        "\n- %s: Necesario %.2f %s, Disponible %.2f %s",
                        faltante.get("materiaPrima"),
                        faltante.get("necesario"),
                        faltante.get("unidad"),
                        faltante.get("disponible"),
                        faltante.get("unidad")
                    ));
                });

                throw new BusinessRuleException(
                    "STOCK_INSUFICIENTE",
                    mensaje.toString(),
                    ingredientesFaltantes // Esto se envía en el campo "detalles" del JSON
                );
            }

            // Si llegamos aquí, hay stock suficiente → Descontar usando FEFO
            receta.getIngredientes().forEach(ingrediente -> {
                Long materiaPrimaId = ingrediente.getMateriaPrimaId();
                Double cantidadNecesaria = ingrediente.getCantidadNecesaria() * multiplicador;

                List<LoteMateriaPrima> lotesDisponibles = loteMateriaPrimaRepository
                        .findLotesByMateriaPrimaIdOrderByFechaVencimientoAsc(materiaPrimaId)
                        .stream()
                        .filter(lote -> lote.getStockActual() > 0)
                        .collect(Collectors.toList());

                // Descontar stock usando FEFO (primero los que vencen más pronto)
                double cantidadRestante = cantidadNecesaria;
                for (LoteMateriaPrima lote : lotesDisponibles) {
                    if (cantidadRestante <= 0) break;

                    double stockLote = lote.getStockActual();
                    double aDescontar = Math.min(stockLote, cantidadRestante);

                    lote.setStockActual(stockLote - aDescontar);
                    loteMateriaPrimaRepository.save(lote);

                    cantidadRestante -= aDescontar;
                }
            });
        }

        // Calcular costo unitario si no viene en el DTO
        Double costoUnitario = dto.getCostoUnitario();
        if (costoUnitario == null && dto.getCostoProduccionTotal() != null && dto.getCantidadProducida() != null) {
            costoUnitario = dto.getCostoProduccionTotal() / dto.getCantidadProducida();
        }

        LoteProducto lote = LoteProducto.builder()
                .productoId(producto.getId())
                .cantidadProducida(dto.getCantidadProducida())
                .stockActual(dto.getStockActual() != null ? dto.getStockActual() : dto.getCantidadProducida())
                .costoProduccionTotal(dto.getCostoProduccionTotal())
                .costoUnitario(costoUnitario)
                .fechaProduccion(dto.getFechaProduccion())
                .fechaVencimiento(dto.getFechaVencimiento())
                .estado(dto.getEstado() != null ? dto.getEstado() : "disponible")
                .build();

        LoteProducto saved = loteProductoRepository.save(lote);
        return convertToDTO(saved);
    }

    public LoteProductoDTO update(Long id, LoteProductoDTO dto) {
        LoteProducto lote = loteProductoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                    "Lote de producto no encontrado con ID: " + id));

        if (dto.getCantidadProducida() != null) {
            lote.setCantidadProducida(dto.getCantidadProducida());
        }
        if (dto.getStockActual() != null) {
            lote.setStockActual(dto.getStockActual());
        }
        if (dto.getCostoProduccionTotal() != null) {
            lote.setCostoProduccionTotal(dto.getCostoProduccionTotal());
        }
        if (dto.getCostoUnitario() != null) {
            lote.setCostoUnitario(dto.getCostoUnitario());
        } else if (dto.getCostoProduccionTotal() != null && dto.getCantidadProducida() != null) {
            lote.setCostoUnitario(dto.getCostoProduccionTotal() / dto.getCantidadProducida());
        }
        if (dto.getFechaProduccion() != null) {
            lote.setFechaProduccion(dto.getFechaProduccion());
        }
        if (dto.getFechaVencimiento() != null) {
            lote.setFechaVencimiento(dto.getFechaVencimiento());
        }
        if (dto.getEstado() != null) {
            lote.setEstado(dto.getEstado());
        }

        LoteProducto updated = loteProductoRepository.save(lote);
        return convertToDTO(updated);
    }

    public void delete(Long id) {
        // Validar que existe antes de eliminar
        if (!loteProductoRepository.existsById(id)) {
            throw new RecursoNoEncontradoException(
                "Lote de producto no encontrado con ID: " + id);
        }
        loteProductoRepository.deleteById(id);
    }

    public List<LoteProductoDTO> listByProducto(Long productoId) {
        List<LoteProducto> lotes = loteProductoRepository.findLotesByProductoIdOrderByFechaProduccionDesc(productoId);
        return lotes.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<LoteProductoDTO> listByProductoOrderByVencimiento(Long productoId) {
        List<LoteProducto> lotes = loteProductoRepository.findLotesByProductoIdOrderByFechaVencimientoAsc(productoId);
        return lotes.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<LoteProductoDTO> listLotesDisponibles(Long productoId) {
        List<LoteProducto> lotes = loteProductoRepository.findLotesDisponiblesByProductoIdOrderByFechaVencimientoAsc(productoId);
        return lotes.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public Integer getStockTotalByProducto(Long productoId) {
        return loteProductoRepository.sumStockActualByProductoId(productoId);
    }

    public List<StockDisponibleDTO> verificarStockDisponible(Long productoId, double multiplicador) {
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                    "Producto no encontrado con ID: " + productoId));

        RecetaMaestra receta = producto.getRecetaMaestra();
        if (receta == null) {
            throw new BusinessRuleException(
                "RECETA_NO_ENCONTRADA",
                "El producto no tiene una receta asociada");
        }

        List<StockDisponibleDTO> stocksDisponibles = new ArrayList<>();

        receta.getIngredientes().forEach(ingrediente -> {
            Long materiaPrimaId = ingrediente.getMateriaPrimaId();
            Double cantidadNecesaria = ingrediente.getCantidadNecesaria() * multiplicador;

            // Obtener nombre y unidad de la materia prima
            var materiaPrima = materiaPrimaRepository.findById(materiaPrimaId).orElse(null);
            String materiaPrimaNombre = materiaPrima != null ? materiaPrima.getNombre() : "Desconocida";
            String unidad = materiaPrima != null ? materiaPrima.getUnidad() : "";

            // Calcular stock disponible
            Double stockDisponible = loteMateriaPrimaRepository
                    .sumStockActualByMateriaPrimaId(materiaPrimaId);
            if (stockDisponible == null) {
                stockDisponible = 0.0;
            }

            boolean suficiente = stockDisponible >= cantidadNecesaria;

            stocksDisponibles.add(StockDisponibleDTO.builder()
                    .materiaPrimaId(materiaPrimaId)
                    .materiaPrimaNombre(materiaPrimaNombre)
                    .cantidadNecesaria(cantidadNecesaria)
                    .stockDisponible(stockDisponible)
                    .suficiente(suficiente)
                    .unidad(unidad)
                    .build());
        });

        return stocksDisponibles;
    }

    private LoteProductoDTO convertToDTO(LoteProducto lote) {
        return LoteProductoDTO.builder()
                .id(lote.getId())
                .productoId(lote.getProductoId())
                .cantidadProducida(lote.getCantidadProducida())
                .stockActual(lote.getStockActual())
                .costoProduccionTotal(lote.getCostoProduccionTotal())
                .costoUnitario(lote.getCostoUnitario())
                .fechaProduccion(lote.getFechaProduccion())
                .fechaVencimiento(lote.getFechaVencimiento())
                .estado(lote.getEstado())
                .build();
    }

    public void descontarStock(Long productoId, Map<String, Object> datos) {
        Integer descontarCantidad = (Integer) datos.get("descontarCantidad");
        List<LoteProducto> lotes = loteProductoRepository.findLotesDisponiblesByProductoIdOrderByFechaVencimientoAsc(productoId);

        for (LoteProducto lote : lotes) {
            if (descontarCantidad <= 0) {
                break;
            }
            Integer stockActual = lote.getStockActual();
            if (stockActual >= descontarCantidad) {
                lote.setStockActual(stockActual - descontarCantidad);
                descontarCantidad = 0;
            } else {
                descontarCantidad -= stockActual;
                lote.setStockActual(0);
            }
            loteProductoRepository.save(lote);
        }

        if (descontarCantidad > 0) {
            throw new BusinessRuleException(
                "STOCK_INSUFICIENTE",
                "No hay suficiente stock para descontar la cantidad solicitada. Faltan " + descontarCantidad + " unidades."
            );
        }
    }

    public LoteProducto getLoteById(Long loteId) {
        return loteProductoRepository.findById(loteId)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                    "Lote de producto no encontrado con ID: " + loteId));
    }

    /**
     * Obtener información de múltiples lotes con sus productos en una sola consulta (batch)
     * Optimización para evitar N+1 queries
     */
    public List<LoteConProductoDTO> getLotesConProductosBatch(List<Long> lotesIds) {
        if (lotesIds == null || lotesIds.isEmpty()) {
            return new java.util.ArrayList<>();
        }

        // 1. Obtener todos los lotes de una vez
        List<LoteProducto> lotes = loteProductoRepository.findAllById(lotesIds);
        
        // 2. Extraer IDs de productos únicos
        List<Long> productosIds = lotes.stream()
                .map(LoteProducto::getProductoId)
                .distinct()
                .collect(Collectors.toList());
        
        // 3. Obtener todos los productos de una vez
        List<Producto> productos = productoRepository.findAllById(productosIds);
        
        // 4. Crear un mapa para búsqueda rápida
        java.util.Map<Long, Producto> productosMap = productos.stream()
                .collect(Collectors.toMap(Producto::getId, p -> p));
        
        // 5. Construir los DTOs combinados
        return lotes.stream()
                .map(lote -> {
                    Producto producto = productosMap.get(lote.getProductoId());
                    return LoteConProductoDTO.builder()
                            .idLote(lote.getId())
                            .idProducto(lote.getProductoId())
                            .nombreProducto(producto != null ? producto.getNombre() : "Desconocido")
                            .tipoProducto(producto != null && producto.getTipoProducto() != null 
                                    ? producto.getTipoProducto().name() 
                                    : "NO_APLICA")
                            .stockActual(lote.getStockActual())
                            .cantidadProducida(lote.getCantidadProducida())
                            .build();
                })
                .collect(Collectors.toList());
    }
}
