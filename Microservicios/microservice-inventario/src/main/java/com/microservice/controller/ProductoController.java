package com.microservice.controller;

import com.microservice.dto.ProductoDTO;
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

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        service.delete(id);
    }
}
