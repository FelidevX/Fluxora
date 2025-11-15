package com.microservice.service;

import com.microservice.dto.RecetaDTO;
import com.microservice.entity.Receta;
import com.microservice.repository.RecetaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecetaServiceTest {

    @Mock
    private RecetaRepository recetaRepository;

    @InjectMocks
    private RecetaService recetaService;

    private Receta receta;
    private RecetaDTO recetaDTO;

    @BeforeEach
    void setUp() {
        receta = Receta.builder()
                .id(1L)
                .productoId(1L)
                .materiaPrimaId(10L)
                .cantidadNecesaria(500.0)
                .unidad("gr")
                .build();

        recetaDTO = RecetaDTO.builder()
                .productoId(1L)
                .materiaPrimaId(10L)
                .cantidadNecesaria(500.0)
                .unidad("gr")
                .build();
    }

    @Test
    void getAllRecetas_DeberiaRetornarListaDeRecetas() {
        // Arrange
        Receta receta2 = Receta.builder()
                .id(2L)
                .productoId(1L)
                .materiaPrimaId(11L)
                .cantidadNecesaria(200.0)
                .unidad("gr")
                .build();

        when(recetaRepository.findAll()).thenReturn(Arrays.asList(receta, receta2));

        // Act
        List<Receta> result = recetaService.getAllRecetas();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(1L, result.get(0).getId());
        assertEquals(500.0, result.get(0).getCantidadNecesaria());
        verify(recetaRepository, times(1)).findAll();
    }

    @Test
    void getAllRecetas_DeberiaRetornarListaVacia() {
        // Arrange
        when(recetaRepository.findAll()).thenReturn(Collections.emptyList());

        // Act
        List<Receta> result = recetaService.getAllRecetas();

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(recetaRepository, times(1)).findAll();
    }

    @Test
    void getRecetasByProductoId_DeberiaRetornarRecetasDelProducto() {
        // Arrange
        Receta receta2 = Receta.builder()
                .id(2L)
                .productoId(1L)
                .materiaPrimaId(11L)
                .cantidadNecesaria(200.0)
                .unidad("gr")
                .build();

        when(recetaRepository.findByProductoId(1L)).thenReturn(Arrays.asList(receta, receta2));

        // Act
        List<Receta> result = recetaService.getRecetasByProductoId(1L);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(1L, result.get(0).getProductoId());
        assertEquals(1L, result.get(1).getProductoId());
        verify(recetaRepository, times(1)).findByProductoId(1L);
    }

    @Test
    void getRecetasByProductoId_DeberiaRetornarListaVaciaCuandoNoHayRecetas() {
        // Arrange
        when(recetaRepository.findByProductoId(999L)).thenReturn(Collections.emptyList());

        // Act
        List<Receta> result = recetaService.getRecetasByProductoId(999L);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(recetaRepository, times(1)).findByProductoId(999L);
    }

    @Test
    void getRecetaById_DeberiaRetornarRecetaCuandoExiste() {
        // Arrange
        when(recetaRepository.findById(1L)).thenReturn(Optional.of(receta));

        // Act
        Optional<Receta> result = recetaService.getRecetaById(1L);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getId());
        assertEquals(500.0, result.get().getCantidadNecesaria());
        verify(recetaRepository, times(1)).findById(1L);
    }

    @Test
    void getRecetaById_DeberiaRetornarVacioCuandoNoExiste() {
        // Arrange
        when(recetaRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        Optional<Receta> result = recetaService.getRecetaById(999L);

        // Assert
        assertFalse(result.isPresent());
        verify(recetaRepository, times(1)).findById(999L);
    }

    @Test
    void createReceta_DeberiaCrearNuevaReceta() {
        // Arrange
        Receta recetaGuardada = Receta.builder()
                .id(3L)
                .productoId(1L)
                .materiaPrimaId(10L)
                .cantidadNecesaria(500.0)
                .unidad("gr")
                .build();

        when(recetaRepository.save(any(Receta.class))).thenReturn(recetaGuardada);

        // Act
        Receta result = recetaService.createReceta(recetaDTO);

        // Assert
        assertNotNull(result);
        assertEquals(3L, result.getId());
        assertEquals(1L, result.getProductoId());
        assertEquals(10L, result.getMateriaPrimaId());
        assertEquals(500.0, result.getCantidadNecesaria());
        assertEquals("gr", result.getUnidad());
        verify(recetaRepository, times(1)).save(any(Receta.class));
    }

    @Test
    void updateReceta_DeberiaActualizarRecetaExistente() {
        // Arrange
        RecetaDTO updateDTO = RecetaDTO.builder()
                .productoId(1L)
                .materiaPrimaId(10L)
                .cantidadNecesaria(600.0)
                .unidad("kg")
                .build();

        when(recetaRepository.findById(1L)).thenReturn(Optional.of(receta));
        when(recetaRepository.save(any(Receta.class))).thenReturn(receta);

        // Act
        Receta result = recetaService.updateReceta(1L, updateDTO);

        // Assert
        assertNotNull(result);
        assertEquals(600.0, result.getCantidadNecesaria());
        assertEquals("kg", result.getUnidad());
        verify(recetaRepository, times(1)).findById(1L);
        verify(recetaRepository, times(1)).save(receta);
    }

    @Test
    void updateReceta_DeberiaLanzarExcepcionCuandoNoExiste() {
        // Arrange
        RecetaDTO updateDTO = RecetaDTO.builder()
                .productoId(1L)
                .materiaPrimaId(10L)
                .cantidadNecesaria(600.0)
                .unidad("kg")
                .build();

        when(recetaRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            recetaService.updateReceta(999L, updateDTO);
        });
        assertEquals("Receta no encontrada con ID: 999", exception.getMessage());
        verify(recetaRepository, times(1)).findById(999L);
        verify(recetaRepository, never()).save(any(Receta.class));
    }

    @Test
    void deleteReceta_DeberiaEliminarReceta() {
        // Arrange
        doNothing().when(recetaRepository).deleteById(1L);

        // Act
        recetaService.deleteReceta(1L);

        // Assert
        verify(recetaRepository, times(1)).deleteById(1L);
    }

    @Test
    void deleteRecetasByProductoId_DeberiaEliminarTodasLasRecetasDelProducto() {
        // Arrange
        Receta receta2 = Receta.builder()
                .id(2L)
                .productoId(1L)
                .materiaPrimaId(11L)
                .cantidadNecesaria(200.0)
                .unidad("gr")
                .build();

        List<Receta> recetas = Arrays.asList(receta, receta2);
        when(recetaRepository.findByProductoId(1L)).thenReturn(recetas);
        doNothing().when(recetaRepository).deleteAll(recetas);

        // Act
        recetaService.deleteRecetasByProductoId(1L);

        // Assert
        verify(recetaRepository, times(1)).findByProductoId(1L);
        verify(recetaRepository, times(1)).deleteAll(recetas);
    }

    @Test
    void deleteRecetasByProductoId_DeberiaEliminarListaVaciaCuandoNoHayRecetas() {
        // Arrange
        when(recetaRepository.findByProductoId(999L)).thenReturn(Collections.emptyList());
        doNothing().when(recetaRepository).deleteAll(Collections.emptyList());

        // Act
        recetaService.deleteRecetasByProductoId(999L);

        // Assert
        verify(recetaRepository, times(1)).findByProductoId(999L);
        verify(recetaRepository, times(1)).deleteAll(Collections.emptyList());
    }
}
