package com.microservice.controller;

import com.microservice.dto.MermaProductoDTO;
import com.microservice.dto.MermaProductoResponseDTO;
import com.microservice.service.MermaProductoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/mermas")
@RequiredArgsConstructor
public class MermaProductoController {

    private final MermaProductoService mermaService;

    /**
     * Registrar una merma manual
     */
    @PostMapping("/manual")
    public ResponseEntity<MermaProductoResponseDTO> registrarMermaManual(
            @RequestBody MermaProductoDTO dto) {
        try {
            MermaProductoResponseDTO response = mermaService.registrarMermaManual(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Registrar merma automática de todos los productos
     */
    @PostMapping("/automatica")
    public ResponseEntity<List<MermaProductoResponseDTO>> registrarMermaAutomatica(
            @RequestBody Map<String, String> payload) {
        try {
            String motivo = payload.getOrDefault("motivo", "Merma automática de fin de turno");
            List<MermaProductoResponseDTO> responses = mermaService.registrarMermaAutomatica(motivo);
            return ResponseEntity.status(HttpStatus.CREATED).body(responses);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Obtener todas las mermas
     */
    @GetMapping
    public ResponseEntity<List<MermaProductoResponseDTO>> obtenerTodasLasMermas() {
        List<MermaProductoResponseDTO> mermas = mermaService.obtenerTodasLasMermas();
        return ResponseEntity.ok(mermas);
    }

    /**
     * Obtener mermas por producto
     */
    @GetMapping("/producto/{productoId}")
    public ResponseEntity<List<MermaProductoResponseDTO>> obtenerMermasPorProducto(
            @PathVariable Long productoId) {
        List<MermaProductoResponseDTO> mermas = mermaService.obtenerMermasPorProducto(productoId);
        return ResponseEntity.ok(mermas);
    }

    /**
     * Obtener mermas por rango de fechas
     */
    @GetMapping("/fechas")
    public ResponseEntity<List<MermaProductoResponseDTO>> obtenerMermasPorFechas(
            @RequestParam String fechaInicio,
            @RequestParam String fechaFin) {
        try {
            LocalDateTime inicio = LocalDateTime.parse(fechaInicio);
            LocalDateTime fin = LocalDateTime.parse(fechaFin);
            List<MermaProductoResponseDTO> mermas = mermaService.obtenerMermasPorFechas(inicio, fin);
            return ResponseEntity.ok(mermas);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
