package com.microservice.controller;

import com.microservice.dto.LoteProductoDTO;
import com.microservice.entity.LoteProducto;
import com.microservice.service.LoteProductoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/productos")
public class LoteProductoController {

    private final LoteProductoService loteProductoService;

    public LoteProductoController(LoteProductoService loteProductoService) {
        this.loteProductoService = loteProductoService;
    }

    @PostMapping("/{productoId}/lotes")
    public ResponseEntity<LoteProductoDTO> createLote(@PathVariable Long productoId, @RequestBody LoteProductoDTO dto) {
        LoteProductoDTO saved = loteProductoService.save(productoId, dto);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{productoId}/lotes/{loteId}")
    public ResponseEntity<LoteProductoDTO> updateLote(@PathVariable Long productoId, @PathVariable Long loteId, @RequestBody LoteProductoDTO dto) {
        LoteProductoDTO updated = loteProductoService.update(loteId, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{productoId}/lotes/{loteId}")
    public ResponseEntity<Void> deleteLote(@PathVariable Long productoId, @PathVariable Long loteId) {
        loteProductoService.delete(loteId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{productoId}/lotes")
    public ResponseEntity<List<LoteProductoDTO>> listLotes(@PathVariable Long productoId) {
        List<LoteProductoDTO> list = loteProductoService.listByProducto(productoId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{productoId}/lotes/disponibles")
    public ResponseEntity<List<LoteProductoDTO>> listLotesDisponibles(@PathVariable Long productoId) {
        List<LoteProductoDTO> list = loteProductoService.listLotesDisponibles(productoId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{productoId}/lotes/por-vencimiento")
    public ResponseEntity<List<LoteProductoDTO>> listLotesPorVencimiento(@PathVariable Long productoId) {
        List<LoteProductoDTO> list = loteProductoService.listByProductoOrderByVencimiento(productoId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{productoId}/stock-total")
    public ResponseEntity<Integer> getStockTotal(@PathVariable Long productoId) {
        Integer stockTotal = loteProductoService.getStockTotalByProducto(productoId);
        return ResponseEntity.ok(stockTotal);
    }

    @PutMapping("/{productoId}/descontar-stock")
    public ResponseEntity<Void> descontarStock(@PathVariable Long productoId, @RequestBody Map<String, Object> datos) {
        loteProductoService.descontarStock(productoId, datos);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/lotes/{loteId}")
    public ResponseEntity<LoteProducto> getLoteById(@PathVariable Long loteId) {
        LoteProducto lote = loteProductoService.getLoteById(loteId);
        return ResponseEntity.ok(lote);
    }
}
