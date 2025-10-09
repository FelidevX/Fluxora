package com.microservice.controller;

import com.microservice.dto.LoteMateriaPrimaDTO;
import com.microservice.service.LoteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/materias-primas")
public class LoteController {

    private final LoteService loteService;

    public LoteController(LoteService loteService) {
        this.loteService = loteService;
    }

    @PostMapping("/{materiaId}/lotes")
    public ResponseEntity<LoteMateriaPrimaDTO> createLote(@PathVariable Long materiaId, @RequestBody LoteMateriaPrimaDTO dto) {
        LoteMateriaPrimaDTO saved = loteService.save(materiaId, dto);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{materiaId}/lotes")
    public ResponseEntity<List<LoteMateriaPrimaDTO>> listLotes(@PathVariable Long materiaId) {
        List<LoteMateriaPrimaDTO> list = loteService.listByMateria(materiaId);
        return ResponseEntity.ok(list);
    }
}
