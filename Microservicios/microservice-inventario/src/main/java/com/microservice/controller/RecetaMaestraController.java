package com.microservice.controller;

import com.microservice.entity.RecetaMaestra;
import com.microservice.dto.RecetaMaestraDTO;
import com.microservice.dto.RecetaMaestraResponseDTO;
import com.microservice.service.RecetaMaestraService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/recetas-maestras")

public class RecetaMaestraController {

    @Autowired
    private RecetaMaestraService recetaMaestraService;

    @GetMapping
    public ResponseEntity<List<RecetaMaestraResponseDTO>> getAllRecetasMaestras() {
        List<RecetaMaestraResponseDTO> recetas = recetaMaestraService.getAllRecetasMaestrasDTO();
        return ResponseEntity.ok(recetas);
    }

    @GetMapping("/activas")
    public ResponseEntity<List<RecetaMaestra>> getRecetasActivas() {
        List<RecetaMaestra> recetas = recetaMaestraService.getRecetasActivas();
        return ResponseEntity.ok(recetas);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecetaMaestra> getRecetaMaestraById(@PathVariable Long id) {
        Optional<RecetaMaestra> receta = recetaMaestraService.getRecetaMaestraById(id);
        return receta.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/categoria/{categoria}")
    public ResponseEntity<List<RecetaMaestra>> getRecetasByCategoria(@PathVariable String categoria) {
        List<RecetaMaestra> recetas = recetaMaestraService.getRecetasByCategoria(categoria);
        return ResponseEntity.ok(recetas);
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<RecetaMaestra>> buscarRecetasPorNombre(@RequestParam String nombre) {
        List<RecetaMaestra> recetas = recetaMaestraService.buscarRecetasPorNombre(nombre);
        return ResponseEntity.ok(recetas);
    }

    @PostMapping
    public ResponseEntity<RecetaMaestra> createRecetaMaestra(@RequestBody RecetaMaestraDTO recetaDTO) {
        try {
            RecetaMaestra nuevaReceta = recetaMaestraService.createRecetaMaestra(recetaDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevaReceta);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecetaMaestra> updateRecetaMaestra(@PathVariable Long id, @RequestBody RecetaMaestraDTO recetaDTO) {
        try {
            RecetaMaestra recetaActualizada = recetaMaestraService.updateRecetaMaestra(id, recetaDTO);
            return ResponseEntity.ok(recetaActualizada);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecetaMaestra(@PathVariable Long id) {
        try {
            recetaMaestraService.deleteRecetaMaestra(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/toggle-activa")
    public ResponseEntity<Void> toggleRecetaActiva(@PathVariable Long id) {
        try {
            recetaMaestraService.toggleRecetaActiva(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}