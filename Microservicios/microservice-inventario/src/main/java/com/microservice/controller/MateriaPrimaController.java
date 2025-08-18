package com.microservice.controller;

import com.microservice.dto.MateriaPrimaDTO;
import com.microservice.service.MateriaPrimaService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/materias-primas")
public class MateriaPrimaController {

    private final MateriaPrimaService service;

    public MateriaPrimaController(MateriaPrimaService service) {
        this.service = service;
    }

    @GetMapping
    public List<MateriaPrimaDTO> listar() {
        return service.findAll();
    }

    @PostMapping
    public MateriaPrimaDTO crear(@RequestBody MateriaPrimaDTO dto) {
        return service.save(dto);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        service.delete(id);
    }
}
