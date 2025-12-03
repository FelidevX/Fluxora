package com.microservice.controller;

import com.microservice.dto.InsumoProduccionDTO;
import com.microservice.service.InsumoProduccionService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/insumos-produccion")
public class InsumoProduccionController {

    private final InsumoProduccionService service;

    public InsumoProduccionController(InsumoProduccionService service) {
        this.service = service;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCER')")
    @GetMapping
    public List<InsumoProduccionDTO> listar() {
        return service.findAll();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCER')")
    @PostMapping
    public InsumoProduccionDTO crear(@RequestBody InsumoProduccionDTO dto) {
        return service.save(dto);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCER')")
    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        service.delete(id);
    }
}
