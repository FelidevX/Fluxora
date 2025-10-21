package com.microservice.service;

import com.microservice.dto.LoteProductoDTO;
import com.microservice.dto.StockDisponibleDTO;
import com.microservice.entity.LoteProducto;
import com.microservice.entity.Producto;
import com.microservice.entity.LoteMateriaPrima;
import com.microservice.entity.RecetaMaestra;
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
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con ID: " + productoId));

        // Obtener la receta del producto
        RecetaMaestra receta = producto.getRecetaMaestra();

        // Si hay receta, validar y descontar stock de materias primas usando FEFO (First Expired, First Out)
        if (receta != null && dto.getCantidadProducida() != null) {
            // Calcular el multiplicador basado en la cantidad producida
            double multiplicador = dto.getCantidadProducida() / receta.getCantidadBase();

            // Validar y descontar cada ingrediente
            receta.getIngredientes().forEach(ingrediente -> {
                Long materiaPrimaId = ingrediente.getMateriaPrimaId();
                Double cantidadNecesaria = ingrediente.getCantidadNecesaria() * multiplicador;

                // Obtener lotes disponibles ordenados por fecha de vencimiento (FEFO)
                // Primero se consumen los que vencen más pronto
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

                // Validar que hay suficiente stock
                if (stockTotal < cantidadNecesaria) {
                    throw new RuntimeException(
                            String.format("Stock insuficiente para materia prima ID %d. " +
                                    "Necesario: %.2f, Disponible: %.2f",
                                    materiaPrimaId, cantidadNecesaria, stockTotal));
                }

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
                .orElseThrow(() -> new RuntimeException("Lote de producto no encontrado con ID: " + id));

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

    /**
     * Verifica el stock disponible de materias primas para una producción
     * @param productoId ID del producto
     * @param multiplicador Cuántas veces se va a preparar la receta
     * @return Lista de stocks disponibles por ingrediente
     */
    public List<StockDisponibleDTO> verificarStockDisponible(Long productoId, double multiplicador) {
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con ID: " + productoId));

        RecetaMaestra receta = producto.getRecetaMaestra();
        if (receta == null) {
            throw new RuntimeException("El producto no tiene una receta asociada");
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
            throw new RuntimeException("No hay suficiente stock para descontar la cantidad solicitada.");
        }
    }

    public LoteProducto getLoteById(Long loteId) {
        Optional<LoteProducto> lote = loteProductoRepository.findById(loteId);
        if (lote.isEmpty()) {
            throw new RuntimeException("Lote de producto no encontrado con ID: " + loteId);
        }
        return lote.get();
    }
}
