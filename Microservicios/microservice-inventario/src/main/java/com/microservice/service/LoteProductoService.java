package com.microservice.service;

import com.microservice.dto.LoteProductoDTO;
import com.microservice.entity.LoteProducto;
import com.microservice.entity.Producto;
import com.microservice.repository.LoteProductoRepository;
import com.microservice.repository.ProductoRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LoteProductoService {

    private final LoteProductoRepository loteProductoRepository;
    private final ProductoRepository productoRepository;

    public LoteProductoService(LoteProductoRepository loteProductoRepository, ProductoRepository productoRepository) {
        this.loteProductoRepository = loteProductoRepository;
        this.productoRepository = productoRepository;
    }

    public LoteProductoDTO save(Long productoId, LoteProductoDTO dto) {
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con ID: " + productoId));

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
}
