package com.microservice.service;

import com.microservice.entity.Receta;
import com.microservice.dto.RecetaDTO;
import com.microservice.repository.RecetaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RecetaService {

    @Autowired
    private RecetaRepository recetaRepository;

    public List<Receta> getAllRecetas() {
        return recetaRepository.findAll();
    }

    public List<Receta> getRecetasByProductoId(Long productoId) {
        return recetaRepository.findByProductoId(productoId);
    }

    public Optional<Receta> getRecetaById(Long id) {
        return recetaRepository.findById(id);
    }

    public Receta createReceta(RecetaDTO recetaDTO) {
        Receta receta = Receta.builder()
                .productoId(recetaDTO.getProductoId())
                .materiaPrimaId(recetaDTO.getMateriaPrimaId())
                .cantidadNecesaria(recetaDTO.getCantidadNecesaria())
                .unidad(recetaDTO.getUnidad())
                .build();
        
        return recetaRepository.save(receta);
    }

    public Receta updateReceta(Long id, RecetaDTO recetaDTO) {
        Optional<Receta> recetaExistente = recetaRepository.findById(id);
        
        if (recetaExistente.isPresent()) {
            Receta receta = recetaExistente.get();
            receta.setProductoId(recetaDTO.getProductoId());
            receta.setMateriaPrimaId(recetaDTO.getMateriaPrimaId());
            receta.setCantidadNecesaria(recetaDTO.getCantidadNecesaria());
            receta.setUnidad(recetaDTO.getUnidad());
            
            return recetaRepository.save(receta);
        }
        
        throw new RuntimeException("Receta no encontrada con ID: " + id);
    }

    public void deleteReceta(Long id) {
        recetaRepository.deleteById(id);
    }

    public void deleteRecetasByProductoId(Long productoId) {
        List<Receta> recetas = recetaRepository.findByProductoId(productoId);
        recetaRepository.deleteAll(recetas);
    }
}