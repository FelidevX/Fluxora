package com.microservice.service;

import com.microservice.entity.RecetaMaestra;
import com.microservice.entity.RecetaIngrediente;
import com.microservice.dto.RecetaMaestraDTO;
import com.microservice.dto.RecetaMaestraResponseDTO;
import com.microservice.dto.RecetaIngredienteResponseDTO;
import com.microservice.repository.RecetaMaestraRepository;
import com.microservice.repository.RecetaIngredienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RecetaMaestraService {

    @Autowired
    private RecetaMaestraRepository recetaMaestraRepository;
    
    @Autowired
    private RecetaIngredienteRepository recetaIngredienteRepository;

    @Autowired
    private com.microservice.repository.LoteMateriaPrimaRepository loteMateriaPrimaRepository;

    // Método helper para convertir entidad a DTO de respuesta
    private RecetaMaestraResponseDTO convertirAResponseDTO(RecetaMaestra receta) {
        List<RecetaIngredienteResponseDTO> ingredientesDTO = null;
        
        if (receta.getIngredientes() != null) {
            ingredientesDTO = receta.getIngredientes().stream()
                .map(this::convertirIngredienteAResponseDTO)
                .collect(Collectors.toList());
        }
        
        // Calcular precio estimado sumando los costos parciales de los ingredientes
        Double precioEstimadoCalculado = 0.0;
        if (ingredientesDTO != null) {
            for (RecetaIngredienteResponseDTO ing : ingredientesDTO) {
                if (ing.getCostoParcial() != null) {
                    precioEstimadoCalculado += ing.getCostoParcial();
                }
            }
        }

        return RecetaMaestraResponseDTO.builder()
                .id(receta.getId())
                .nombre(receta.getNombre())
                .descripcion(receta.getDescripcion())
                .categoria(receta.getCategoria())
                .unidadBase(receta.getUnidadBase())
                .cantidadBase(receta.getCantidadBase())
                .precioEstimado(precioEstimadoCalculado) // se pasa el precio estimado desde el service no como input
                .precioUnidad(receta.getPrecioUnidad())
                .tiempoPreparacion(receta.getTiempoPreparacion())
                .fechaCreacion(receta.getFechaCreacion())
                .activa(receta.getActiva())
                .ingredientes(ingredientesDTO)
                .build();
    }
    
    private RecetaIngredienteResponseDTO convertirIngredienteAResponseDTO(RecetaIngrediente ingrediente) {
    // Obtener PPP (precio promedio ponderado) desde lotes. Si no hay lotes, ppp = 0
    Double ppp = loteMateriaPrimaRepository.findPppByMateriaPrimaId(ingrediente.getMateriaPrimaId());
    if (ppp == null) ppp = 0.0;
    Double cantidad = ingrediente.getCantidadNecesaria() == null ? 0.0 : ingrediente.getCantidadNecesaria();
    Double costoParcial = cantidad * ppp;

    return RecetaIngredienteResponseDTO.builder()
        .id(ingrediente.getId())
        .materiaPrimaId(ingrediente.getMateriaPrimaId())
        .materiaPrimaNombre(ingrediente.getMateriaPrimaNombre())
        .cantidadNecesaria(ingrediente.getCantidadNecesaria())
        .unidad(ingrediente.getUnidad())
        .esOpcional(ingrediente.getEsOpcional())
        .notas(ingrediente.getNotas())
        .ppp(ppp)
        .costoParcial(costoParcial)
        .build();
    }

    public List<RecetaMaestraResponseDTO> getAllRecetasMaestrasDTO() {
        return recetaMaestraRepository.findAll().stream()
                .map(this::convertirAResponseDTO)
                .collect(Collectors.toList());
    }

    public List<RecetaMaestra> getAllRecetasMaestras() {
        return recetaMaestraRepository.findAll();
    }

    public List<RecetaMaestra> getRecetasActivas() {
        return recetaMaestraRepository.findByActivaTrue();
    }

    public Optional<RecetaMaestra> getRecetaMaestraById(Long id) {
        return recetaMaestraRepository.findById(id);
    }

    public List<RecetaMaestra> getRecetasByCategoria(String categoria) {
        return recetaMaestraRepository.findByCategoria(categoria);
    }

    public List<RecetaMaestra> buscarRecetasPorNombre(String nombre) {
        return recetaMaestraRepository.findByNombreContainingIgnoreCase(nombre);
    }

    @Transactional
    public RecetaMaestra createRecetaMaestra(RecetaMaestraDTO recetaDTO) {
        // Crear la receta maestra
        RecetaMaestra recetaMaestra = RecetaMaestra.builder()
                .nombre(recetaDTO.getNombre())
                .descripcion(recetaDTO.getDescripcion())
                .categoria(recetaDTO.getCategoria())
                .unidadBase(recetaDTO.getUnidadBase())
                .cantidadBase(recetaDTO.getCantidadBase())
        // precioEstimado se calculará dinámicamente desde los lotes
        .precioEstimado(null)
                .precioUnidad(recetaDTO.getPrecioUnidad())
                .tiempoPreparacion(recetaDTO.getTiempoPreparacion())
                .fechaCreacion(LocalDate.now())
                .activa(true)
                .build();
        
        RecetaMaestra recetaGuardada = recetaMaestraRepository.save(recetaMaestra);
        
        // Crear los ingredientes
        if (recetaDTO.getIngredientes() != null && !recetaDTO.getIngredientes().isEmpty()) {
            List<RecetaIngrediente> ingredientes = recetaDTO.getIngredientes().stream()
                    .map(ingredienteDTO -> RecetaIngrediente.builder()
                            .recetaMaestra(recetaGuardada)
                            .materiaPrimaId(ingredienteDTO.getMateriaPrimaId())
                            .materiaPrimaNombre(ingredienteDTO.getMateriaPrimaNombre())
                            .cantidadNecesaria(ingredienteDTO.getCantidadNecesaria())
                            .unidad(ingredienteDTO.getUnidad())
                            .esOpcional(ingredienteDTO.getEsOpcional())
                            .notas(ingredienteDTO.getNotas())
                            .build())
                    .collect(Collectors.toList());
            
            recetaIngredienteRepository.saveAll(ingredientes);
        }
        
        return recetaGuardada;
    }

    @Transactional
    public RecetaMaestra updateRecetaMaestra(Long id, RecetaMaestraDTO recetaDTO) {
        Optional<RecetaMaestra> recetaExistente = recetaMaestraRepository.findById(id);
        
        if (recetaExistente.isPresent()) {
            RecetaMaestra receta = recetaExistente.get();
            
            // Actualizar los datos de la receta
            receta.setNombre(recetaDTO.getNombre());
            receta.setDescripcion(recetaDTO.getDescripcion());
            receta.setCategoria(recetaDTO.getCategoria());
            receta.setUnidadBase(recetaDTO.getUnidadBase());
            receta.setCantidadBase(recetaDTO.getCantidadBase());
            // No aceptar precioEstimado manual — se calcula al consultar
            receta.setPrecioEstimado(null);
            receta.setPrecioUnidad(recetaDTO.getPrecioUnidad());
            receta.setTiempoPreparacion(recetaDTO.getTiempoPreparacion());
            
            RecetaMaestra recetaActualizada = recetaMaestraRepository.save(receta);
            
            // Eliminar ingredientes existentes y crear los nuevos
            List<RecetaIngrediente> ingredientesExistentes = recetaIngredienteRepository.findByRecetaMaestraId(id);
            recetaIngredienteRepository.deleteAll(ingredientesExistentes);
            
            if (recetaDTO.getIngredientes() != null && !recetaDTO.getIngredientes().isEmpty()) {
                List<RecetaIngrediente> nuevosIngredientes = recetaDTO.getIngredientes().stream()
                        .map(ingredienteDTO -> RecetaIngrediente.builder()
                                .recetaMaestra(recetaActualizada)
                                .materiaPrimaId(ingredienteDTO.getMateriaPrimaId())
                                .materiaPrimaNombre(ingredienteDTO.getMateriaPrimaNombre())
                                .cantidadNecesaria(ingredienteDTO.getCantidadNecesaria())
                                .unidad(ingredienteDTO.getUnidad())
                                .esOpcional(ingredienteDTO.getEsOpcional())
                                .notas(ingredienteDTO.getNotas())
                                .build())
                        .collect(Collectors.toList());
                
                recetaIngredienteRepository.saveAll(nuevosIngredientes);
            }
            
            return recetaActualizada;
        }
        
        throw new RuntimeException("Receta no encontrada con ID: " + id);
    }

    @Transactional
    public void deleteRecetaMaestra(Long id) {
        // Eliminar ingredientes primero
        List<RecetaIngrediente> ingredientes = recetaIngredienteRepository.findByRecetaMaestraId(id);
        recetaIngredienteRepository.deleteAll(ingredientes);
        
        // Eliminar la receta
        recetaMaestraRepository.deleteById(id);
    }

    public void toggleRecetaActiva(Long id) {
        Optional<RecetaMaestra> recetaOpt = recetaMaestraRepository.findById(id);
        if (recetaOpt.isPresent()) {
            RecetaMaestra receta = recetaOpt.get();
            receta.setActiva(!receta.getActiva());
            recetaMaestraRepository.save(receta);
        } else {
            throw new RuntimeException("Receta no encontrada con ID: " + id);
        }
    }
}