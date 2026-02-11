package com.microservice.inventario.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.microservice.controller.LoteProductoController;
import com.microservice.dto.LoteProductoDTO;
import com.microservice.dto.StockDisponibleDTO;
import com.microservice.entity.LoteProducto;
import com.microservice.service.LoteProductoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = LoteProductoController.class)
@AutoConfigureMockMvc(addFilters = false)
class LoteProductoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private LoteProductoService loteProductoService;

    @Autowired
    private ObjectMapper objectMapper;

    private LoteProductoDTO loteProductoDTO;

    @BeforeEach
    void setUp() {
        loteProductoDTO = LoteProductoDTO.builder()
                .id(1L)
                .productoId(1L)
                .cantidadProducida(10)
                .stockActual(10)
                .costoProduccionTotal(100.0)
                .costoUnitario(10.0)
                .fechaProduccion(LocalDate.now())
                .fechaVencimiento(LocalDate.now().plusDays(7))
                .estado("disponible")
                .build();
    }

    @Test
    void createLote_DeberiaCrearNuevoLote() throws Exception {
        // Arrange
        LoteProductoDTO nuevoLote = LoteProductoDTO.builder()
                .cantidadProducida(20)
                .costoProduccionTotal(200.0)
                .fechaProduccion(LocalDate.now())
                .build();

        LoteProductoDTO loteCreado = LoteProductoDTO.builder()
                .id(2L)
                .productoId(1L)
                .cantidadProducida(20)
                .stockActual(20)
                .costoProduccionTotal(200.0)
                .costoUnitario(10.0)
                .fechaProduccion(LocalDate.now())
                .estado("disponible")
                .build();

        when(loteProductoService.save(eq(1L), any(LoteProductoDTO.class))).thenReturn(loteCreado);

        // Act & Assert
        mockMvc.perform(post("/productos/1/lotes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(nuevoLote)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.productoId").value(1))
                .andExpect(jsonPath("$.cantidadProducida").value(20));

        verify(loteProductoService, times(1)).save(eq(1L), any(LoteProductoDTO.class));
    }

    @Test
    void updateLote_DeberiaActualizarLoteExistente() throws Exception {
        // Arrange
        LoteProductoDTO updateDTO = LoteProductoDTO.builder()
                .stockActual(8)
                .estado("parcialmente_agotado")
                .build();

        LoteProductoDTO loteActualizado = LoteProductoDTO.builder()
                .id(1L)
                .productoId(1L)
                .cantidadProducida(10)
                .stockActual(8)
                .costoProduccionTotal(100.0)
                .costoUnitario(10.0)
                .fechaProduccion(LocalDate.now())
                .estado("parcialmente_agotado")
                .build();

        when(loteProductoService.update(eq(1L), any(LoteProductoDTO.class))).thenReturn(loteActualizado);

        // Act & Assert
        mockMvc.perform(put("/productos/1/lotes/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.stockActual").value(8))
                .andExpect(jsonPath("$.estado").value("parcialmente_agotado"));

        verify(loteProductoService, times(1)).update(eq(1L), any(LoteProductoDTO.class));
    }

    @Test
    void deleteLote_DeberiaEliminarLote() throws Exception {
        // Arrange
        doNothing().when(loteProductoService).delete(1L);

        // Act & Assert
        mockMvc.perform(delete("/productos/1/lotes/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());

        verify(loteProductoService, times(1)).delete(1L);
    }

    @Test
    void listLotes_DeberiaRetornarLotesDelProducto() throws Exception {
        // Arrange
        LoteProductoDTO lote2 = LoteProductoDTO.builder()
                .id(2L)
                .productoId(1L)
                .cantidadProducida(20)
                .stockActual(15)
                .costoProduccionTotal(200.0)
                .costoUnitario(10.0)
                .fechaProduccion(LocalDate.now().minusDays(1))
                .estado("disponible")
                .build();

        when(loteProductoService.listByProducto(1L)).thenReturn(Arrays.asList(loteProductoDTO, lote2));

        // Act & Assert
        mockMvc.perform(get("/productos/1/lotes")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[1].id").value(2));

        verify(loteProductoService, times(1)).listByProducto(1L);
    }

    @Test
    void listLotes_DeberiaRetornarListaVacia() throws Exception {
        // Arrange
        when(loteProductoService.listByProducto(999L)).thenReturn(Collections.emptyList());

        // Act & Assert
        mockMvc.perform(get("/productos/999/lotes")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(loteProductoService, times(1)).listByProducto(999L);
    }

    @Test
    void listLotesDisponibles_DeberiaRetornarSoloLotesDisponibles() throws Exception {
        // Arrange
        when(loteProductoService.listLotesDisponibles(1L))
                .thenReturn(Collections.singletonList(loteProductoDTO));

        // Act & Assert
        mockMvc.perform(get("/productos/1/lotes/disponibles")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].estado").value("disponible"));

        verify(loteProductoService, times(1)).listLotesDisponibles(1L);
    }

    @Test
    void listLotesPorVencimiento_DeberiaRetornarLotesOrdenadosPorVencimiento() throws Exception {
        // Arrange
        LoteProductoDTO loteProximoAVencer = LoteProductoDTO.builder()
                .id(2L)
                .productoId(1L)
                .cantidadProducida(10)
                .stockActual(8)
                .fechaVencimiento(LocalDate.now().plusDays(2))
                .build();

        when(loteProductoService.listByProductoOrderByVencimiento(1L))
                .thenReturn(Arrays.asList(loteProximoAVencer, loteProductoDTO));

        // Act & Assert
        mockMvc.perform(get("/productos/1/lotes/por-vencimiento")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(2));

        verify(loteProductoService, times(1)).listByProductoOrderByVencimiento(1L);
    }

    @Test
    void getStockTotal_DeberiaRetornarStockTotalDelProducto() throws Exception {
        // Arrange
        when(loteProductoService.getStockTotalByProducto(1L)).thenReturn(100);

        // Act & Assert
        mockMvc.perform(get("/productos/1/stock-total")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(100));

        verify(loteProductoService, times(1)).getStockTotalByProducto(1L);
    }

    @Test
    void descontarStock_DeberiaDescontarStockDelProducto() throws Exception {
        // Arrange
        Map<String, Object> datos = new HashMap<>();
        datos.put("descontarCantidad", 5);

        doNothing().when(loteProductoService).descontarStock(eq(1L), anyMap());

        // Act & Assert
        mockMvc.perform(put("/productos/1/descontar-stock")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(datos)))
                .andExpect(status().isOk());

        verify(loteProductoService, times(1)).descontarStock(eq(1L), anyMap());
    }

    @Test
    void getLoteById_DeberiaRetornarLoteCuandoExiste() throws Exception {
        // Arrange
        LoteProducto lote = LoteProducto.builder()
                .id(1L)
                .productoId(1L)
                .cantidadProducida(10)
                .stockActual(10)
                .costoProduccionTotal(100.0)
                .costoUnitario(10.0)
                .fechaProduccion(LocalDate.now())
                .estado("disponible")
                .build();

        when(loteProductoService.getLoteById(1L)).thenReturn(lote);

        // Act & Assert
        mockMvc.perform(get("/productos/lotes/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.productoId").value(1))
                .andExpect(jsonPath("$.cantidadProducida").value(10));

        verify(loteProductoService, times(1)).getLoteById(1L);
    }

    @Test
    void verificarStockDisponible_DeberiaRetornarStocksPorIngrediente() throws Exception {
        // Arrange
        StockDisponibleDTO stock1 = StockDisponibleDTO.builder()
                .materiaPrimaId(10L)
                .materiaPrimaNombre("Harina")
                .cantidadNecesaria(1000.0)
                .stockDisponible(1500.0)
                .suficiente(true)
                .unidad("gr")
                .build();

        StockDisponibleDTO stock2 = StockDisponibleDTO.builder()
                .materiaPrimaId(11L)
                .materiaPrimaNombre("Azúcar")
                .cantidadNecesaria(500.0)
                .stockDisponible(200.0)
                .suficiente(false)
                .unidad("gr")
                .build();

        when(loteProductoService.verificarStockDisponible(1L, 2.0))
                .thenReturn(Arrays.asList(stock1, stock2));

        // Act & Assert
        mockMvc.perform(get("/productos/1/verificar-stock")
                .param("multiplicador", "2.0")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].materiaPrimaNombre").value("Harina"))
                .andExpect(jsonPath("$[0].suficiente").value(true))
                .andExpect(jsonPath("$[1].materiaPrimaNombre").value("Azúcar"))
                .andExpect(jsonPath("$[1].suficiente").value(false));

        verify(loteProductoService, times(1)).verificarStockDisponible(1L, 2.0);
    }

    @Test
    void verificarStockDisponible_DeberiaRetornarListaVaciaSinIngredientes() throws Exception {
        // Arrange
        when(loteProductoService.verificarStockDisponible(999L, 1.0))
                .thenReturn(Collections.emptyList());

        // Act & Assert
        mockMvc.perform(get("/productos/999/verificar-stock")
                .param("multiplicador", "1.0")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(loteProductoService, times(1)).verificarStockDisponible(999L, 1.0);
    }
}
