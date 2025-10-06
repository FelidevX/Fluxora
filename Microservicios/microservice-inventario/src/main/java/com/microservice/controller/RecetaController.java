package com.microservice.controller;

import com.microservice.entity.Receta;
import com.microservice.dto.RecetaDTO;
import com.microservice.service.RecetaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/recetas")
public class RecetaController {

    @Autowired
    private RecetaService recetaService;

    @GetMapping
    public ResponseEntity<List<Receta>> getAllRecetas() {
        List<Receta> recetas = recetaService.getAllRecetas();
        return ResponseEntity.ok(recetas);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Receta> getRecetaById(@PathVariable Long id) {
        Optional<Receta> receta = recetaService.getRecetaById(id);
        return receta.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/producto/{productoId}")
    public ResponseEntity<List<Receta>> getRecetasByProductoId(@PathVariable Long productoId) {
        List<Receta> recetas = recetaService.getRecetasByProductoId(productoId);
        return ResponseEntity.ok(recetas);
    }

    @PostMapping
    public ResponseEntity<Receta> createReceta(@RequestBody RecetaDTO recetaDTO) {
        try {
            Receta nuevaReceta = recetaService.createReceta(recetaDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevaReceta);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Receta> updateReceta(@PathVariable Long id, @RequestBody RecetaDTO recetaDTO) {
        try {
            Receta recetaActualizada = recetaService.updateReceta(id, recetaDTO);
            return ResponseEntity.ok(recetaActualizada);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReceta(@PathVariable Long id) {
        try {
            recetaService.deleteReceta(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/producto/{productoId}")
    public ResponseEntity<Void> deleteRecetasByProductoId(@PathVariable Long productoId) {
        try {
            recetaService.deleteRecetasByProductoId(productoId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}