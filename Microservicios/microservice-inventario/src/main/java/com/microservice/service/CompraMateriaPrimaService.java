package com.microservice.service;

import com.microservice.dto.*;
import com.microservice.entity.CompraMateriaPrima;
import com.microservice.entity.LoteMateriaPrima;
import com.microservice.entity.MateriaPrima;
import com.microservice.repository.CompraMateriaPrimaRepository;
import com.microservice.repository.LoteMateriaPrimaRepository;
import com.microservice.repository.MateriaPrimaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CompraMateriaPrimaService {

    private final CompraMateriaPrimaRepository compraRepository;
    private final LoteMateriaPrimaRepository loteRepository;
    private final MateriaPrimaRepository materiaPrimaRepository;

    public CompraMateriaPrimaService(
            CompraMateriaPrimaRepository compraRepository,
            LoteMateriaPrimaRepository loteRepository,
            MateriaPrimaRepository materiaPrimaRepository) {
        this.compraRepository = compraRepository;
        this.loteRepository = loteRepository;
        this.materiaPrimaRepository = materiaPrimaRepository;
    }

    @Transactional
    public CompraMateriaPrimaResponseDTO crearCompra(CompraMateriaPrimaDTO dto) {
        // Validar que existan los lotes
        if (dto.getLotes() == null || dto.getLotes().isEmpty()) {
            throw new RuntimeException("La compra debe contener al menos un lote");
        }

        // Crear la compra
        CompraMateriaPrima compra = CompraMateriaPrima.builder()
                .numDoc(dto.getNumDoc())
                .tipoDoc(dto.getTipoDoc())
                .proveedor(dto.getProveedor())
                .fechaCompra(LocalDate.parse(dto.getFechaCompra()))
                .fechaPago(dto.getFechaPago() != null ? LocalDate.parse(dto.getFechaPago()) : null)
                .build();

        CompraMateriaPrima compraSaved = compraRepository.save(compra);

        // Crear los lotes asociados a la compra
        List<LoteMateriaPrima> lotes = dto.getLotes().stream().map(loteDTO -> {
            // Validar que exista la materia prima
            MateriaPrima materia = materiaPrimaRepository.findById(loteDTO.getMateriaPrimaId())
                    .orElseThrow(() -> new RuntimeException(
                            "Materia prima no encontrada con ID: " + loteDTO.getMateriaPrimaId()));

            return LoteMateriaPrima.builder()
                    .materiaPrimaId(materia.getId())
                    .compra(compraSaved)
                    .cantidad(loteDTO.getCantidad())
                    .stockActual(loteDTO.getCantidad()) // stock_actual = cantidad al crear
                    .costoUnitario(loteDTO.getCostoUnitario())
                    .numeroLote(loteDTO.getNumeroLote())
                    .fechaCompra(compraSaved.getFechaCompra())
                    .fechaVencimiento(loteDTO.getFechaVencimiento() != null 
                            ? LocalDate.parse(loteDTO.getFechaVencimiento()) 
                            : null)
                    .build();
        }).collect(Collectors.toList());

        List<LoteMateriaPrima> lotesSaved = loteRepository.saveAll(lotes);

        // Construir respuesta
        return buildResponseDTO(compraSaved, lotesSaved);
    }

    public List<CompraMateriaPrimaResponseDTO> listarCompras() {
        List<CompraMateriaPrima> compras = compraRepository.findAllByOrderByFechaCompraDesc();
        return compras.stream()
                .map(compra -> {
                    List<LoteMateriaPrima> lotes = loteRepository.findLotesByCompraId(compra.getId());
                    return buildResponseDTO(compra, lotes);
                })
                .collect(Collectors.toList());
    }

    public CompraMateriaPrimaResponseDTO obtenerCompraPorId(Long id) {
        CompraMateriaPrima compra = compraRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Compra no encontrada con ID: " + id));
        List<LoteMateriaPrima> lotes = loteRepository.findLotesByCompraId(compra.getId());
        return buildResponseDTO(compra, lotes);
    }

    public List<CompraMateriaPrimaResponseDTO> buscarPorProveedor(String proveedor) {
        List<CompraMateriaPrima> compras = compraRepository.findByProveedorContainingIgnoreCase(proveedor);
        return compras.stream()
                .map(compra -> {
                    List<LoteMateriaPrima> lotes = loteRepository.findLotesByCompraId(compra.getId());
                    return buildResponseDTO(compra, lotes);
                })
                .collect(Collectors.toList());
    }

    public List<CompraMateriaPrimaResponseDTO> buscarPorNumDoc(String numDoc) {
        List<CompraMateriaPrima> compras = compraRepository.findByNumDoc(numDoc);
        return compras.stream()
                .map(compra -> {
                    List<LoteMateriaPrima> lotes = loteRepository.findLotesByCompraId(compra.getId());
                    return buildResponseDTO(compra, lotes);
                })
                .collect(Collectors.toList());
    }

    public List<CompraMateriaPrimaResponseDTO> obtenerComprasRecientes(int dias) {
        LocalDate fechaDesde = LocalDate.now().minusDays(dias);
        List<CompraMateriaPrima> compras = compraRepository.findComprasRecientes(fechaDesde);
        return compras.stream()
                .map(compra -> {
                    List<LoteMateriaPrima> lotes = loteRepository.findLotesByCompraId(compra.getId());
                    return buildResponseDTO(compra, lotes);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void eliminarCompra(Long id) {
        CompraMateriaPrima compra = compraRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Compra no encontrada con ID: " + id));

        // Verificar que los lotes no hayan sido consumidos
        List<LoteMateriaPrima> lotes = loteRepository.findLotesByCompraId(id);
        boolean hayLotesConsumidos = lotes.stream()
                .anyMatch(lote -> !lote.getStockActual().equals(lote.getCantidad()));

        if (hayLotesConsumidos) {
            throw new RuntimeException(
                    "No se puede eliminar la compra porque algunos lotes ya han sido consumidos");
        }

        // Eliminar lotes primero (por la relación)
        loteRepository.deleteAll(lotes);
        // Eliminar la compra
        compraRepository.delete(compra);
    }

    private CompraMateriaPrimaResponseDTO buildResponseDTO(
            CompraMateriaPrima compra, 
            List<LoteMateriaPrima> lotes) {
        
        List<LoteMateriaPrimaDTO> lotesDTO = lotes.stream()
                .map(lote -> LoteMateriaPrimaDTO.builder()
                            .id(lote.getId())
                            .materiaPrimaId(lote.getMateriaPrimaId())
                            .compraId(compra.getId())
                            .cantidad(lote.getCantidad())
                            .stockActual(lote.getStockActual())
                            .costoUnitario(lote.getCostoUnitario())
                            .numeroLote(lote.getNumeroLote())
                            .fechaCompra(lote.getFechaCompra())
                            .fechaVencimiento(lote.getFechaVencimiento())
                            .build())
                .collect(Collectors.toList());

        // Calcular monto total
        Double montoTotal = lotes.stream()
                .mapToDouble(lote -> lote.getCantidad() * lote.getCostoUnitario())
                .sum();

        return CompraMateriaPrimaResponseDTO.builder()
                .id(compra.getId())
                .numDoc(compra.getNumDoc())
                .tipoDoc(compra.getTipoDoc())
                .proveedor(compra.getProveedor())
                .fechaCompra(compra.getFechaCompra())
                .fechaPago(compra.getFechaPago())
                .createdAt(compra.getCreatedAt())
                .totalLotes(lotes.size())
                .montoTotal(montoTotal)
                .lotes(lotesDTO)
                .build();
    }
}
