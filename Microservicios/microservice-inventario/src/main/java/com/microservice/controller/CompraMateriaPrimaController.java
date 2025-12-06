package com.microservice.controller;

import com.microservice.dto.CompraMateriaPrimaDTO;
import com.microservice.dto.CompraMateriaPrimaResponseDTO;
import com.microservice.service.CompraMateriaPrimaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/compras")
public class CompraMateriaPrimaController {

    private final CompraMateriaPrimaService compraService;

    public CompraMateriaPrimaController(CompraMateriaPrimaService compraService) {
        this.compraService = compraService;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCER')")
    @PostMapping
    public ResponseEntity<CompraMateriaPrimaResponseDTO> crearCompra(@RequestBody CompraMateriaPrimaDTO dto) {
        try {
            CompraMateriaPrimaResponseDTO compra = compraService.crearCompra(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(compra);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCER')")
    @GetMapping
    public ResponseEntity<List<CompraMateriaPrimaResponseDTO>> listarCompras() {
        List<CompraMateriaPrimaResponseDTO> compras = compraService.listarCompras();
        return ResponseEntity.ok(compras);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCER')")
    @GetMapping("/{id}")
    public ResponseEntity<CompraMateriaPrimaResponseDTO> obtenerCompraPorId(@PathVariable Long id) {
        try {
            CompraMateriaPrimaResponseDTO compra = compraService.obtenerCompraPorId(id);
            return ResponseEntity.ok(compra);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCER')")
    @GetMapping("/proveedor/{proveedor}")
    public ResponseEntity<List<CompraMateriaPrimaResponseDTO>> buscarPorProveedor(@PathVariable String proveedor) {
        List<CompraMateriaPrimaResponseDTO> compras = compraService.buscarPorProveedor(proveedor);
        return ResponseEntity.ok(compras);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCER')")
    @GetMapping("/num-doc/{numDoc}")
    public ResponseEntity<List<CompraMateriaPrimaResponseDTO>> buscarPorNumDoc(@PathVariable String numDoc) {
        List<CompraMateriaPrimaResponseDTO> compras = compraService.buscarPorNumDoc(numDoc);
        return ResponseEntity.ok(compras);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCER')")
    @GetMapping("/recientes")
    public ResponseEntity<List<CompraMateriaPrimaResponseDTO>> obtenerComprasRecientes(
            @RequestParam(defaultValue = "30") int dias) {
        List<CompraMateriaPrimaResponseDTO> compras = compraService.obtenerComprasRecientes(dias);
        return ResponseEntity.ok(compras);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarCompra(@PathVariable Long id) {
        try {
            compraService.eliminarCompra(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/estado-pago")
    public ResponseEntity<CompraMateriaPrimaResponseDTO> actualizarEstadoPago(
            @PathVariable Long id,
            @RequestParam String estadoPago) {
        try {
            CompraMateriaPrimaResponseDTO compra = compraService.actualizarEstadoPago(id, estadoPago);
            return ResponseEntity.ok(compra);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
