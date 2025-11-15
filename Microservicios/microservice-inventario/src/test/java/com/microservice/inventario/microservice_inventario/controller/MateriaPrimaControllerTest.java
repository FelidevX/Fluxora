package com.microservice.inventario.microservice_inventario.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.microservice.controller.MateriaPrimaController;
import com.microservice.dto.MateriaPrimaDTO;
import com.microservice.service.MateriaPrimaService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = MateriaPrimaController.class)
@AutoConfigureMockMvc(addFilters = false)
class MateriaPrimaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MateriaPrimaService materiaPrimaService;

    @Autowired
    private ObjectMapper objectMapper;

    private MateriaPrimaDTO materiaPrimaDTO;

    @BeforeEach
    void setUp() {
        materiaPrimaDTO = MateriaPrimaDTO.builder()
                .id(1L)
                .nombre("Harina de Trigo")
                .unidad("kg")
                .cantidad(100.0)
                .build();
    }

    @Test
    void listar_DeberiaRetornarListaDeMateriasPrimas() throws Exception {
        // Arrange
        MateriaPrimaDTO materiaPrima2 = MateriaPrimaDTO.builder()
                .id(2L)
                .nombre("Azúcar")
                .unidad("kg")
                .cantidad(50.0)
                .build();

        when(materiaPrimaService.findAll()).thenReturn(Arrays.asList(materiaPrimaDTO, materiaPrima2));

        // Act & Assert
        mockMvc.perform(get("/materias-primas")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].nombre").value("Harina de Trigo"))
                .andExpect(jsonPath("$[0].cantidad").value(100.0))
                .andExpect(jsonPath("$[1].nombre").value("Azúcar"))
                .andExpect(jsonPath("$[1].cantidad").value(50.0));

        verify(materiaPrimaService, times(1)).findAll();
    }

    @Test
    void listar_DeberiaRetornarListaVacia() throws Exception {
        // Arrange
        when(materiaPrimaService.findAll()).thenReturn(Collections.emptyList());

        // Act & Assert
        mockMvc.perform(get("/materias-primas")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(materiaPrimaService, times(1)).findAll();
    }

    @Test
    void crear_DeberiaCrearNuevaMateriaPrima() throws Exception {
        // Arrange
        MateriaPrimaDTO nuevaMateria = MateriaPrimaDTO.builder()
                .nombre("Levadura")
                .unidad("gr")
                .build();

        MateriaPrimaDTO materiaCreada = MateriaPrimaDTO.builder()
                .id(3L)
                .nombre("Levadura")
                .unidad("gr")
                .build();

        when(materiaPrimaService.save(any(MateriaPrimaDTO.class))).thenReturn(materiaCreada);

        // Act & Assert
        mockMvc.perform(post("/materias-primas")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(nuevaMateria)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.nombre").value("Levadura"))
                .andExpect(jsonPath("$.unidad").value("gr"));

        verify(materiaPrimaService, times(1)).save(any(MateriaPrimaDTO.class));
    }

    @Test
    void actualizar_DeberiaActualizarMateriaPrimaExistente() throws Exception {
        // Arrange
        MateriaPrimaDTO updateDTO = MateriaPrimaDTO.builder()
                .nombre("Harina de Trigo Integral")
                .unidad("kg")
                .build();

        MateriaPrimaDTO materiaActualizada = MateriaPrimaDTO.builder()
                .id(1L)
                .nombre("Harina de Trigo Integral")
                .unidad("kg")
                .cantidad(100.0)
                .build();

        when(materiaPrimaService.save(any(MateriaPrimaDTO.class))).thenReturn(materiaActualizada);

        // Act & Assert
        mockMvc.perform(put("/materias-primas/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nombre").value("Harina de Trigo Integral"));

        verify(materiaPrimaService, times(1)).save(any(MateriaPrimaDTO.class));
    }

    @Test
    void actualizarStock_DeberiaActualizarStockDeMateriaPrima() throws Exception {
        // Arrange
        MateriaPrimaDTO materiaConStockActualizado = MateriaPrimaDTO.builder()
                .id(1L)
                .nombre("Harina de Trigo")
                .unidad("kg")
                .cantidad(150.0)
                .build();

        when(materiaPrimaService.actualizarStock(1L, 150.0)).thenReturn(materiaConStockActualizado);

        // Act & Assert
        mockMvc.perform(patch("/materias-primas/1/stock")
                .param("cantidad", "150.0")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.cantidad").value(150.0));

        verify(materiaPrimaService, times(1)).actualizarStock(1L, 150.0);
    }

    @Test
    void eliminar_DeberiaEliminarMateriaPrima() throws Exception {
        // Arrange
        doNothing().when(materiaPrimaService).delete(1L);

        // Act & Assert
        mockMvc.perform(delete("/materias-primas/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(materiaPrimaService, times(1)).delete(1L);
    }

    @Test
    void buscarPorNombre_DeberiaRetornarMateriasCoincidentes() throws Exception {
        // Arrange
        MateriaPrimaDTO materiaPrima2 = MateriaPrimaDTO.builder()
                .id(2L)
                .nombre("Harina de Trigo Integral")
                .unidad("kg")
                .cantidad(75.0)
                .build();

        when(materiaPrimaService.findByNombre("Harina")).thenReturn(Arrays.asList(materiaPrimaDTO, materiaPrima2));

        // Act & Assert
        mockMvc.perform(get("/materias-primas/buscar/Harina")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].nombre").value("Harina de Trigo"))
                .andExpect(jsonPath("$[1].nombre").value("Harina de Trigo Integral"));

        verify(materiaPrimaService, times(1)).findByNombre("Harina");
    }

    @Test
    void buscarPorNombre_DeberiaRetornarListaVaciaCuandoNoCoincide() throws Exception {
        // Arrange
        when(materiaPrimaService.findByNombre("Chocolate")).thenReturn(Collections.emptyList());

        // Act & Assert
        mockMvc.perform(get("/materias-primas/buscar/Chocolate")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(materiaPrimaService, times(1)).findByNombre("Chocolate");
    }
}
