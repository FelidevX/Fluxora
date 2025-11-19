package com.microservice.service;

import com.microservice.dto.MermaProductoDTO;
import com.microservice.dto.MermaProductoResponseDTO;
import com.microservice.entity.LoteProducto;
import com.microservice.entity.MermaProducto;
import com.microservice.entity.Producto;
import com.microservice.repository.LoteProductoRepository;
import com.microservice.repository.MermaProductoRepository;
import com.microservice.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MermaProductoService {

    private final MermaProductoRepository mermaRepository;
    private final ProductoRepository productoRepository;
    private final LoteProductoRepository loteProductoRepository;

    /**
     * Registrar una merma manual de un producto específico
     */
    @Transactional
    public MermaProductoResponseDTO registrarMermaManual(MermaProductoDTO dto) {
        // Validar que el producto existe
        Producto producto = productoRepository.findById(dto.getProductoId())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        // Si se especifica un lote, descontar de ese lote
        if (dto.getLoteProductoId() != null) {
            LoteProducto lote = loteProductoRepository.findById(dto.getLoteProductoId())
                    .orElseThrow(() -> new RuntimeException("Lote no encontrado"));

            if (lote.getStockActual() < dto.getCantidadMermada().intValue()) {
                throw new RuntimeException("Stock insuficiente en el lote. Disponible: " + lote.getStockActual());
            }

            lote.setStockActual(lote.getStockActual() - dto.getCantidadMermada().intValue());
            loteProductoRepository.save(lote);
        } else {
            // Si no se especifica lote, descontar usando FEFO (First Expired, First Out)
            descontarStockFEFO(dto.getProductoId(), dto.getCantidadMermada());
        }

        // Registrar la merma
        MermaProducto merma = MermaProducto.builder()
                .productoId(dto.getProductoId())
                .loteProductoId(dto.getLoteProductoId())
                .cantidadMermada(dto.getCantidadMermada())
                .motivo(dto.getMotivo())
                .tipoMerma(MermaProducto.TipoMerma.MANUAL)
                .productoNombre(producto.getNombre())
                .fechaRegistro(LocalDateTime.now())
                .build();

        merma = mermaRepository.save(merma);

        return buildResponseDTO(merma);
    }

    /**
     * Registrar merma automática de todos los productos con stock
     */
    @Transactional
    public List<MermaProductoResponseDTO> registrarMermaAutomatica(String motivo) {
        List<MermaProductoResponseDTO> mermasRegistradas = new ArrayList<>();

        // Obtener todos los lotes con stock > 0
        List<LoteProducto> lotesConStock = loteProductoRepository.findAll()
                .stream()
                .filter(lote -> lote.getStockActual() != null && lote.getStockActual() > 0)
                .collect(Collectors.toList());

        for (LoteProducto lote : lotesConStock) {
            // Obtener el producto para el nombre
            Producto producto = productoRepository.findById(lote.getProductoId())
                    .orElse(null);

            if (producto == null) continue;

            // Registrar merma por el stock actual del lote
            MermaProducto merma = MermaProducto.builder()
                    .productoId(lote.getProductoId())
                    .loteProductoId(lote.getId())
                    .cantidadMermada(lote.getStockActual().doubleValue())
                    .motivo(motivo)
                    .tipoMerma(MermaProducto.TipoMerma.AUTOMATICA)
                    .productoNombre(producto.getNombre())
                    .fechaRegistro(LocalDateTime.now())
                    .build();

            merma = mermaRepository.save(merma);
            mermasRegistradas.add(buildResponseDTO(merma));

            // Descontar el stock del lote a 0
            lote.setStockActual(0);
            loteProductoRepository.save(lote);
        }

        return mermasRegistradas;
    }

    /**
     * Obtener todas las mermas
     */
    public List<MermaProductoResponseDTO> obtenerTodasLasMermas() {
        return mermaRepository.findAllByOrderByFechaRegistroDesc()
                .stream()
                .map(this::buildResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener mermas por producto
     */
    public List<MermaProductoResponseDTO> obtenerMermasPorProducto(Long productoId) {
        return mermaRepository.findByProductoIdOrderByFechaRegistroDesc(productoId)
                .stream()
                .map(this::buildResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener mermas por rango de fechas
     */
    public List<MermaProductoResponseDTO> obtenerMermasPorFechas(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        return mermaRepository.findByFechaRegistroBetweenOrderByFechaRegistroDesc(fechaInicio, fechaFin)
                .stream()
                .map(this::buildResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Descontar stock usando FEFO (First Expired, First Out)
     */
    private void descontarStockFEFO(Long productoId, Double cantidadADescontar) {
        List<LoteProducto> lotes = loteProductoRepository
                .findLotesDisponiblesByProductoIdOrderByFechaVencimientoAsc(productoId);

        Double cantidadRestante = cantidadADescontar;

        for (LoteProducto lote : lotes) {
            if (cantidadRestante <= 0) break;

            Integer stockDisponible = lote.getStockActual();
            if (stockDisponible == null || stockDisponible <= 0) continue;

            if (stockDisponible >= cantidadRestante.intValue()) {
                lote.setStockActual(stockDisponible - cantidadRestante.intValue());
                cantidadRestante = 0.0;
            } else {
                lote.setStockActual(0);
                cantidadRestante -= stockDisponible.doubleValue();
            }

            loteProductoRepository.save(lote);
        }

        if (cantidadRestante > 0) {
            throw new RuntimeException("Stock insuficiente. Faltaron: " + cantidadRestante + " kg");
        }
    }

    /**
     * Construir DTO de respuesta
     */
    private MermaProductoResponseDTO buildResponseDTO(MermaProducto merma) {
        return MermaProductoResponseDTO.builder()
                .id(merma.getId())
                .productoId(merma.getProductoId())
                .productoNombre(merma.getProductoNombre())
                .loteProductoId(merma.getLoteProductoId())
                .cantidadMermada(merma.getCantidadMermada())
                .motivo(merma.getMotivo())
                .tipoMerma(merma.getTipoMerma())
                .fechaRegistro(merma.getFechaRegistro())
                .build();
    }
}
