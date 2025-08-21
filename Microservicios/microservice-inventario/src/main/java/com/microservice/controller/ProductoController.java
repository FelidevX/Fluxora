package com.microservice.controller;

import com.microservice.dto.ProductoDTO;
import com.microservice.dto.ProductoConRecetaDTO;
import com.microservice.dto.StockUpdateRequest;
import com.microservice.service.ProductoService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/productos")
public class ProductoController {

    private final ProductoService service;

    public ProductoController(ProductoService service) {
        this.service = service;
    }

    @GetMapping
    public List<ProductoDTO> listar() {
        return service.findAll();
    }

    @PostMapping
    public ProductoDTO crear(@RequestBody ProductoDTO dto) {
        return service.save(dto);
    }

    @PostMapping("/con-receta")
    public ProductoDTO crearConReceta(@RequestBody ProductoConRecetaDTO dto) {
        return service.saveConReceta(dto);
    }

    @PatchMapping("/{id}/stock")
    public ProductoDTO actualizarStock(@PathVariable Long id, @RequestBody StockUpdateRequest request) {
        return service.updateStock(id, request.getCantidad());
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        service.delete(id);
    }
}
