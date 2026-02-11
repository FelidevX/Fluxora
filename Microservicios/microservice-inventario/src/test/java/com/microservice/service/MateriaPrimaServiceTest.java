package com.microservice.service;

import com.microservice.dto.MateriaPrimaDTO;
import com.microservice.entity.MateriaPrima;
import com.microservice.repository.MateriaPrimaRepository;
import com.microservice.repository.LoteMateriaPrimaRepository;
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
class MateriaPrimaServiceTest {

    @Mock
    private MateriaPrimaRepository repository;

    @Mock
    private LoteMateriaPrimaRepository loteRepository;

    @InjectMocks
    private MateriaPrimaService materiaPrimaService;

    private MateriaPrima materiaPrima;
    private MateriaPrimaDTO materiaPrimaDTO;

    @BeforeEach
    void setUp() {
        materiaPrima = MateriaPrima.builder()
                .id(1L)
                .nombre("Harina de Trigo")
                .unidad("kg")
                .build();

        materiaPrimaDTO = MateriaPrimaDTO.builder()
                .id(1L)
                .nombre("Harina de Trigo")
                .unidad("kg")
                .cantidad(100.0)
                .build();
    }

    @Test
    void findAll_DeberiaRetornarListaConStockCalculado() {
        // Arrange
        MateriaPrima materiaPrima2 = MateriaPrima.builder()
                .id(2L)
                .nombre("Azúcar")
                .unidad("kg")
                .build();

        when(repository.findAll()).thenReturn(Arrays.asList(materiaPrima, materiaPrima2));
        when(loteRepository.sumStockActualByMateriaPrimaId(1L)).thenReturn(100.0);
        when(loteRepository.sumStockActualByMateriaPrimaId(2L)).thenReturn(50.0);

        // Act
        List<MateriaPrimaDTO> result = materiaPrimaService.findAll();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Harina de Trigo", result.get(0).getNombre());
        assertEquals(100.0, result.get(0).getCantidad());
        assertEquals("Azúcar", result.get(1).getNombre());
        assertEquals(50.0, result.get(1).getCantidad());
        verify(repository, times(1)).findAll();
        verify(loteRepository, times(1)).sumStockActualByMateriaPrimaId(1L);
        verify(loteRepository, times(1)).sumStockActualByMateriaPrimaId(2L);
    }

    @Test
    void findAll_DeberiaRetornarListaVacia() {
        // Arrange
        when(repository.findAll()).thenReturn(Collections.emptyList());

        // Act
        List<MateriaPrimaDTO> result = materiaPrimaService.findAll();

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(repository, times(1)).findAll();
    }

    @Test
    void findAll_DeberiaAsignarCeroCuandoStockEsNull() {
        // Arrange
        when(repository.findAll()).thenReturn(Arrays.asList(materiaPrima));
        when(loteRepository.sumStockActualByMateriaPrimaId(1L)).thenReturn(null);

        // Act
        List<MateriaPrimaDTO> result = materiaPrimaService.findAll();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(0.0, result.get(0).getCantidad());
        verify(loteRepository, times(1)).sumStockActualByMateriaPrimaId(1L);
    }

    @Test
    void save_DeberiaGuardarMateriaPrima() {
        // Arrange
        MateriaPrimaDTO nuevoDTO = MateriaPrimaDTO.builder()
                .nombre("Levadura")
                .unidad("gr")
                .build();

        MateriaPrima materiaGuardada = MateriaPrima.builder()
                .id(3L)
                .nombre("Levadura")
                .unidad("gr")
                .build();

        when(repository.save(any(MateriaPrima.class))).thenReturn(materiaGuardada);

        // Act
        MateriaPrimaDTO result = materiaPrimaService.save(nuevoDTO);

        // Assert
        assertNotNull(result);
        assertEquals(3L, result.getId());
        assertEquals("Levadura", result.getNombre());
        assertEquals("gr", result.getUnidad());
        verify(repository, times(1)).save(any(MateriaPrima.class));
    }

    @Test
    void save_DeberiaActualizarMateriaPrimaExistente() {
        // Arrange
        MateriaPrimaDTO updateDTO = MateriaPrimaDTO.builder()
                .id(1L)
                .nombre("Harina de Trigo Integral")
                .unidad("kg")
                .build();

        MateriaPrima materiaActualizada = MateriaPrima.builder()
                .id(1L)
                .nombre("Harina de Trigo Integral")
                .unidad("kg")
                .build();

        when(repository.save(any(MateriaPrima.class))).thenReturn(materiaActualizada);

        // Act
        MateriaPrimaDTO result = materiaPrimaService.save(updateDTO);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Harina de Trigo Integral", result.getNombre());
        verify(repository, times(1)).save(any(MateriaPrima.class));
    }

    @Test
    void actualizarStock_DeberiaRetornarDTOConStockActual() {
        // Arrange
        when(loteRepository.sumStockActualByMateriaPrimaId(1L)).thenReturn(150.0);
        when(repository.findById(1L)).thenReturn(Optional.of(materiaPrima));

        // Act
        MateriaPrimaDTO result = materiaPrimaService.actualizarStock(1L, 200.0);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Harina de Trigo", result.getNombre());
        assertEquals(150.0, result.getCantidad()); // Usa el stock calculado de lotes
        verify(loteRepository, times(1)).sumStockActualByMateriaPrimaId(1L);
        verify(repository, times(1)).findById(1L);
    }

    @Test
    void actualizarStock_DeberiaLanzarExcepcionCuandoNoExiste() {
        // Arrange
        when(repository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            materiaPrimaService.actualizarStock(999L, 100.0);
        });
        assertEquals("Materia prima no encontrada con ID: 999", exception.getMessage());
        verify(repository, times(1)).findById(999L);
    }

    @Test
    void actualizarStock_DeberiaAsignarCeroCuandoStockEsNull() {
        // Arrange
        when(loteRepository.sumStockActualByMateriaPrimaId(1L)).thenReturn(null);
        when(repository.findById(1L)).thenReturn(Optional.of(materiaPrima));

        // Act
        MateriaPrimaDTO result = materiaPrimaService.actualizarStock(1L, 100.0);

        // Assert
        assertNotNull(result);
        assertEquals(0.0, result.getCantidad());
        verify(loteRepository, times(1)).sumStockActualByMateriaPrimaId(1L);
    }

    @Test
    void delete_DeberiaEliminarMateriaPrima() {
        // Arrange
        doNothing().when(repository).deleteById(1L);

        // Act
        materiaPrimaService.delete(1L);

        // Assert
        verify(repository, times(1)).deleteById(1L);
    }

    @Test
    void findByNombre_DeberiaRetornarMateriasConNombreCoincidente() {
        // Arrange
        MateriaPrima materiaPrima2 = MateriaPrima.builder()
                .id(2L)
                .nombre("HARINA DE TRIGO")
                .unidad("kg")
                .build();

        when(repository.findAll()).thenReturn(Arrays.asList(materiaPrima, materiaPrima2));

        // Act
        List<MateriaPrimaDTO> result = materiaPrimaService.findByNombre("Harina de Trigo");

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size()); // Búsqueda case-insensitive
        verify(repository, times(1)).findAll();
    }

    @Test
    void findByNombre_DeberiaRetornarListaVaciaCuandoNoCoincide() {
        // Arrange
        when(repository.findAll()).thenReturn(Arrays.asList(materiaPrima));

        // Act
        List<MateriaPrimaDTO> result = materiaPrimaService.findByNombre("Azúcar");

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(repository, times(1)).findAll();
    }

    @Test
    void findByNombre_DeberiaSerCaseInsensitive() {
        // Arrange
        when(repository.findAll()).thenReturn(Arrays.asList(materiaPrima));

        // Act
        List<MateriaPrimaDTO> result = materiaPrimaService.findByNombre("HARINA DE TRIGO");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Harina de Trigo", result.get(0).getNombre());
        verify(repository, times(1)).findAll();
    }
}
