package com.microservice.inventario.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.microservice.controller.ProductoController;
import com.microservice.dto.ProductoDTO;
import com.microservice.service.ProductoService;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = ProductoController.class)
@AutoConfigureMockMvc(addFilters = false)
class ProductoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductoService productoService;

    @Autowired
    private ObjectMapper objectMapper;

    private ProductoDTO productoDTO;

    @BeforeEach
    void setUp() {
        productoDTO = ProductoDTO.builder()
                .id(1L)
                .nombre("Pan Integral")
                .estado("activo")
                .precioVenta(5.50)
                .tipoProducto("CORRIENTE")
                .categoria("panaderia")
                .recetaMaestraId(1L)
                .stockTotal(100)
                .build();
    }

    @Test
    void listar_DeberiaRetornarListaDeProductos() throws Exception {
        // Arrange
        ProductoDTO producto2 = ProductoDTO.builder()
                .id(2L)
                .nombre("Torta Chocolate")
                .estado("activo")
                .precioVenta(25.00)
                .tipoProducto("ESPECIAL")
                .categoria("pasteleria")
                .stockTotal(50)
                .build();

        when(productoService.findAll()).thenReturn(Arrays.asList(productoDTO, producto2));

        // Act & Assert
        mockMvc.perform(get("/productos")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].nombre").value("Pan Integral"))
                .andExpect(jsonPath("$[0].stockTotal").value(100))
                .andExpect(jsonPath("$[1].nombre").value("Torta Chocolate"))
                .andExpect(jsonPath("$[1].stockTotal").value(50));

        verify(productoService, times(1)).findAll();
    }

    @Test
    void listar_DeberiaRetornarListaVacia() throws Exception {
        // Arrange
        when(productoService.findAll()).thenReturn(Collections.emptyList());

        // Act & Assert
        mockMvc.perform(get("/productos")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(productoService, times(1)).findAll();
    }

    @Test
    void obtenerPorId_DeberiaRetornarProductoCuandoExiste() throws Exception {
        // Arrange
        when(productoService.findById(1L)).thenReturn(productoDTO);

        // Act & Assert
        mockMvc.perform(get("/productos/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nombre").value("Pan Integral"))
                .andExpect(jsonPath("$.precioVenta").value(5.50))
                .andExpect(jsonPath("$.tipoProducto").value("CORRIENTE"))
                .andExpect(jsonPath("$.stockTotal").value(100));

        verify(productoService, times(1)).findById(1L);
    }

    @Test
    void obtenerPorId_DeberiaRetornar500CuandoNoExiste() throws Exception {
        // Arrange
        when(productoService.findById(999L))
                .thenThrow(new RuntimeException("Producto no encontrado con ID: 999"));

        // Act & Assert
        mockMvc.perform(get("/productos/999")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError());

        verify(productoService, times(1)).findById(999L);
    }

    @Test
    void crear_DeberiaCrearNuevoProducto() throws Exception {
        // Arrange
        ProductoDTO nuevoProducto = ProductoDTO.builder()
                .nombre("Pan Francés")
                .estado("activo")
                .precioVenta(3.50)
                .tipoProducto("CORRIENTE")
                .categoria("panaderia")
                .recetaMaestraId(1L)
                .build();

        ProductoDTO productoCreado = ProductoDTO.builder()
                .id(3L)
                .nombre("Pan Francés")
                .estado("activo")
                .precioVenta(3.50)
                .tipoProducto("CORRIENTE")
                .categoria("panaderia")
                .recetaMaestraId(1L)
                .stockTotal(0)
                .build();

        when(productoService.save(any(ProductoDTO.class))).thenReturn(productoCreado);

        // Act & Assert
        mockMvc.perform(post("/productos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(nuevoProducto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.nombre").value("Pan Francés"))
                .andExpect(jsonPath("$.precioVenta").value(3.50));

        verify(productoService, times(1)).save(any(ProductoDTO.class));
    }

    @Test
    void crear_DeberiaCrearProductoSinReceta() throws Exception {
        // Arrange
        ProductoDTO productoSinReceta = ProductoDTO.builder()
                .nombre("Producto Sin Receta")
                .estado("activo")
                .precioVenta(10.00)
                .tipoProducto("NO_APLICA")
                .categoria("otros")
                .build();

        ProductoDTO productoCreado = ProductoDTO.builder()
                .id(5L)
                .nombre("Producto Sin Receta")
                .estado("activo")
                .precioVenta(10.00)
                .tipoProducto("NO_APLICA")
                .categoria("otros")
                .stockTotal(0)
                .build();

        when(productoService.save(any(ProductoDTO.class))).thenReturn(productoCreado);

        // Act & Assert
        mockMvc.perform(post("/productos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(productoSinReceta)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.nombre").value("Producto Sin Receta"))
                .andExpect(jsonPath("$.recetaMaestraId").doesNotExist());

        verify(productoService, times(1)).save(any(ProductoDTO.class));
    }

    @Test
    void actualizar_DeberiaActualizarProductoExistente() throws Exception {
        // Arrange
        ProductoDTO updateDTO = ProductoDTO.builder()
                .nombre("Pan Integral Premium")
                .estado("activo")
                .precioVenta(7.50)
                .tipoProducto("ESPECIAL")
                .categoria("panaderia")
                .build();

        ProductoDTO productoActualizado = ProductoDTO.builder()
                .id(1L)
                .nombre("Pan Integral Premium")
                .estado("activo")
                .precioVenta(7.50)
                .tipoProducto("ESPECIAL")
                .categoria("panaderia")
                .recetaMaestraId(1L)
                .stockTotal(100)
                .build();

        when(productoService.update(eq(1L), any(ProductoDTO.class))).thenReturn(productoActualizado);

        // Act & Assert
        mockMvc.perform(put("/productos/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nombre").value("Pan Integral Premium"))
                .andExpect(jsonPath("$.precioVenta").value(7.50))
                .andExpect(jsonPath("$.tipoProducto").value("ESPECIAL"));

        verify(productoService, times(1)).update(eq(1L), any(ProductoDTO.class));
    }

    @Test
    void actualizar_DeberiaRetornar500CuandoNoExiste() throws Exception {
        // Arrange
        ProductoDTO updateDTO = ProductoDTO.builder()
                .nombre("Producto Actualizado")
                .build();

        when(productoService.update(eq(999L), any(ProductoDTO.class)))
                .thenThrow(new RuntimeException("Producto no encontrado con ID: 999"));

        // Act & Assert
        mockMvc.perform(put("/productos/999")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isInternalServerError());

        verify(productoService, times(1)).update(eq(999L), any(ProductoDTO.class));
    }

    @Test
    void eliminar_DeberiaEliminarProducto() throws Exception {
        // Arrange
        doNothing().when(productoService).delete(1L);

        // Act & Assert
        mockMvc.perform(delete("/productos/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());

        verify(productoService, times(1)).delete(1L);
    }

    @Test
    void eliminar_DeberiaRetornar204InclusoCuandoNoExiste() throws Exception {
        // Arrange
        doNothing().when(productoService).delete(999L);

        // Act & Assert
        mockMvc.perform(delete("/productos/999")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());

        verify(productoService, times(1)).delete(999L);
    }
}
