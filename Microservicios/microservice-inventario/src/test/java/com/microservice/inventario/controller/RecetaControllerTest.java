package com.microservice.inventario.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.microservice.controller.RecetaController;
import com.microservice.dto.RecetaDTO;
import com.microservice.entity.Receta;
import com.microservice.service.RecetaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = RecetaController.class)
@AutoConfigureMockMvc(addFilters = false)
class RecetaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RecetaService recetaService;

    @Autowired
    private ObjectMapper objectMapper;

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
    void getAllRecetas_DeberiaRetornarListaDeRecetas() throws Exception {
        // Arrange
        Receta receta2 = Receta.builder()
                .id(2L)
                .productoId(2L)
                .materiaPrimaId(11L)
                .cantidadNecesaria(200.0)
                .unidad("gr")
                .build();

        when(recetaService.getAllRecetas()).thenReturn(Arrays.asList(receta, receta2));

        // Act & Assert
        mockMvc.perform(get("/recetas")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].productoId").value(1))
                .andExpect(jsonPath("$[0].cantidadNecesaria").value(500.0))
                .andExpect(jsonPath("$[1].id").value(2));

        verify(recetaService, times(1)).getAllRecetas();
    }

    @Test
    void getAllRecetas_DeberiaRetornarListaVacia() throws Exception {
        // Arrange
        when(recetaService.getAllRecetas()).thenReturn(Collections.emptyList());

        // Act & Assert
        mockMvc.perform(get("/recetas")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(recetaService, times(1)).getAllRecetas();
    }

    @Test
    void getRecetaById_DeberiaRetornarRecetaCuandoExiste() throws Exception {
        // Arrange
        when(recetaService.getRecetaById(1L)).thenReturn(Optional.of(receta));

        // Act & Assert
        mockMvc.perform(get("/recetas/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.productoId").value(1))
                .andExpect(jsonPath("$.materiaPrimaId").value(10))
                .andExpect(jsonPath("$.cantidadNecesaria").value(500.0));

        verify(recetaService, times(1)).getRecetaById(1L);
    }

    @Test
    void getRecetaById_DeberiaRetornar404CuandoNoExiste() throws Exception {
        // Arrange
        when(recetaService.getRecetaById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/recetas/999")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());

        verify(recetaService, times(1)).getRecetaById(999L);
    }

    @Test
    void getRecetasByProductoId_DeberiaRetornarRecetasDelProducto() throws Exception {
        // Arrange
        Receta receta2 = Receta.builder()
                .id(2L)
                .productoId(1L)
                .materiaPrimaId(11L)
                .cantidadNecesaria(200.0)
                .unidad("gr")
                .build();

        when(recetaService.getRecetasByProductoId(1L)).thenReturn(Arrays.asList(receta, receta2));

        // Act & Assert
        mockMvc.perform(get("/recetas/producto/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].productoId").value(1))
                .andExpect(jsonPath("$[1].productoId").value(1));

        verify(recetaService, times(1)).getRecetasByProductoId(1L);
    }

    @Test
    void getRecetasByProductoId_DeberiaRetornarListaVacia() throws Exception {
        // Arrange
        when(recetaService.getRecetasByProductoId(999L)).thenReturn(Collections.emptyList());

        // Act & Assert
        mockMvc.perform(get("/recetas/producto/999")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(recetaService, times(1)).getRecetasByProductoId(999L);
    }

    @Test
    void createReceta_DeberiaCrearNuevaReceta() throws Exception {
        // Arrange
        Receta recetaCreada = Receta.builder()
                .id(3L)
                .productoId(1L)
                .materiaPrimaId(10L)
                .cantidadNecesaria(500.0)
                .unidad("gr")
                .build();

        when(recetaService.createReceta(any(RecetaDTO.class))).thenReturn(recetaCreada);

        // Act & Assert
        mockMvc.perform(post("/recetas")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(recetaDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.productoId").value(1))
                .andExpect(jsonPath("$.cantidadNecesaria").value(500.0));

        verify(recetaService, times(1)).createReceta(any(RecetaDTO.class));
    }

    @Test
    void createReceta_DeberiaRetornar400EnCasoDeError() throws Exception {
        // Arrange
        when(recetaService.createReceta(any(RecetaDTO.class)))
                .thenThrow(new IllegalArgumentException("Datos inválidos"));

        // Act & Assert
        mockMvc.perform(post("/recetas")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(recetaDTO)))
                .andExpect(status().isBadRequest());

        verify(recetaService, times(1)).createReceta(any(RecetaDTO.class));
    }

    @Test
    void updateReceta_DeberiaActualizarRecetaExistente() throws Exception {
        // Arrange
        RecetaDTO updateDTO = RecetaDTO.builder()
                .productoId(1L)
                .materiaPrimaId(10L)
                .cantidadNecesaria(600.0)
                .unidad("kg")
                .build();

        Receta recetaActualizada = Receta.builder()
                .id(1L)
                .productoId(1L)
                .materiaPrimaId(10L)
                .cantidadNecesaria(600.0)
                .unidad("kg")
                .build();

        when(recetaService.updateReceta(eq(1L), any(RecetaDTO.class))).thenReturn(recetaActualizada);

        // Act & Assert
        mockMvc.perform(put("/recetas/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.cantidadNecesaria").value(600.0))
                .andExpect(jsonPath("$.unidad").value("kg"));

        verify(recetaService, times(1)).updateReceta(eq(1L), any(RecetaDTO.class));
    }

    @Test
    void updateReceta_DeberiaRetornar404CuandoNoExiste() throws Exception {
        // Arrange
        when(recetaService.updateReceta(eq(999L), any(RecetaDTO.class)))
                .thenThrow(new RuntimeException("Receta no encontrada con ID: 999"));

        // Act & Assert
        mockMvc.perform(put("/recetas/999")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(recetaDTO)))
                .andExpect(status().isNotFound());

        verify(recetaService, times(1)).updateReceta(eq(999L), any(RecetaDTO.class));
    }

    @Test
    void updateReceta_DeberiaRetornar400EnCasoDeOtroError() throws Exception {
        // Arrange
        when(recetaService.updateReceta(eq(1L), any(RecetaDTO.class)))
                .thenThrow(new IllegalArgumentException("Datos inválidos"));

        // Act & Assert
        mockMvc.perform(put("/recetas/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(recetaDTO)))
                .andExpect(status().isBadRequest());

        verify(recetaService, times(1)).updateReceta(eq(1L), any(RecetaDTO.class));
    }

    @Test
    void deleteReceta_DeberiaEliminarReceta() throws Exception {
        // Arrange
        doNothing().when(recetaService).deleteReceta(1L);

        // Act & Assert
        mockMvc.perform(delete("/recetas/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());

        verify(recetaService, times(1)).deleteReceta(1L);
    }

    @Test
    void deleteReceta_DeberiaRetornar404EnCasoDeError() throws Exception {
        // Arrange
        doThrow(new RuntimeException("Receta no encontrada")).when(recetaService).deleteReceta(999L);

        // Act & Assert
        mockMvc.perform(delete("/recetas/999")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());

        verify(recetaService, times(1)).deleteReceta(999L);
    }

    @Test
    void deleteRecetasByProductoId_DeberiaEliminarTodasLasRecetas() throws Exception {
        // Arrange
        doNothing().when(recetaService).deleteRecetasByProductoId(1L);

        // Act & Assert
        mockMvc.perform(delete("/recetas/producto/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());

        verify(recetaService, times(1)).deleteRecetasByProductoId(1L);
    }

    @Test
    void deleteRecetasByProductoId_DeberiaRetornar400EnCasoDeError() throws Exception {
        // Arrange
        doThrow(new IllegalArgumentException("Error al eliminar"))
                .when(recetaService).deleteRecetasByProductoId(999L);

        // Act & Assert
        mockMvc.perform(delete("/recetas/producto/999")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());

        verify(recetaService, times(1)).deleteRecetasByProductoId(999L);
    }
}
