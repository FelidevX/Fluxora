package com.microservice.entrega.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.microservice.entrega.dto.ClienteDTO;
import com.microservice.entrega.dto.ProductoEntregadoDTO;
import com.microservice.entrega.dto.RegistroEntregaDTO;
import com.microservice.entrega.entity.RegistroEntrega;
import com.microservice.entrega.entity.SesionReparto;
import com.microservice.entrega.service.EntregaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(EntregaController.class)
@DisplayName("EntregaController Tests")
class EntregaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private EntregaService entregaService;

    private RegistroEntregaDTO registroEntregaDTO;
    private List<RegistroEntrega> historialEntregas;
    private SesionReparto sesionReparto;

    @BeforeEach
    void setUp() {
        // Configurar productos
        ProductoEntregadoDTO producto = new ProductoEntregadoDTO();
        producto.setId_producto(1L);
        producto.setId_lote(10L);
        producto.setNombreProducto("Pan Corriente");
        producto.setTipoProducto("corriente");
        producto.setCantidad_kg(10.0);

        // Configurar DTO de registro de entrega
        registroEntregaDTO = new RegistroEntregaDTO();
        registroEntregaDTO.setId_pedido(1L);
        registroEntregaDTO.setId_cliente(1L);
        registroEntregaDTO.setProductos(Arrays.asList(producto));
        registroEntregaDTO.setCorriente_entregado(10.0);
        registroEntregaDTO.setEspecial_entregado(5.0);
        registroEntregaDTO.setPrecio_corriente(50.0);
        registroEntregaDTO.setPrecio_especial(80.0);
        registroEntregaDTO.setHora_entregada(LocalDateTime.now());
        registroEntregaDTO.setComentario("Entrega test");

        // Configurar historial de entregas
        RegistroEntrega entrega = new RegistroEntrega();
        entrega.setId(1L);
        entrega.setId_cliente(1L);
        entrega.setId_pedido(1L);
        entrega.setHora_entregada(LocalDateTime.now());
        entrega.setCorriente_entregado(10.0);
        entrega.setEspecial_entregado(5.0);
        entrega.setMonto_total(900.0);
        historialEntregas = Arrays.asList(entrega);

        // Configurar sesión de reparto
        sesionReparto = new SesionReparto();
        sesionReparto.setId(1L);
        sesionReparto.setId_driver(100L);
        sesionReparto.setFecha(LocalDate.now());
        sesionReparto.setKg_corriente(50.0);
        sesionReparto.setKg_especial(30.0);
    }

    @Nested
    @DisplayName("Tests de Registro de Entregas")
    class RegistroEntregasTests {

        @Test
        @DisplayName("Debería registrar entrega exitosamente")
        void deberiaRegistrarEntregaExitosamente() throws Exception {
            doNothing().when(entregaService).registrarEntrega(any(RegistroEntregaDTO.class));

            mockMvc.perform(post("/entrega/registrar")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(registroEntregaDTO)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").exists());

            verify(entregaService).registrarEntrega(any(RegistroEntregaDTO.class));
        }

        @Test
        @DisplayName("Debería retornar error cuando id_pedido es null")
        void deberiaRetornarErrorCuandoIdPedidoNull() throws Exception {
            registroEntregaDTO.setId_pedido(null);

            mockMvc.perform(post("/entrega/registrar")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(registroEntregaDTO)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").exists());

            verify(entregaService, never()).registrarEntrega(any());
        }

        @Test
        @DisplayName("Debería retornar error cuando productos está vacío")
        void deberiaRetornarErrorCuandoProductosVacio() throws Exception {
            registroEntregaDTO.setProductos(new ArrayList<>());

            mockMvc.perform(post("/entrega/registrar")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(registroEntregaDTO)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").exists());

            verify(entregaService, never()).registrarEntrega(any());
        }

        @Test
        @DisplayName("Debería manejar excepciones del servicio")
        void deberiaManejarExcepcionesDelServicio() throws Exception {
            doThrow(new RuntimeException("Error en el servicio"))
                    .when(entregaService).registrarEntrega(any(RegistroEntregaDTO.class));

            mockMvc.perform(post("/entrega/registrar")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(registroEntregaDTO)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").exists());
        }
    }

    @Nested
    @DisplayName("Tests de Historial de Entregas")
    class HistorialEntregasTests {

        @Test
        @DisplayName("Debería obtener historial de entregas de un cliente")
        void deberiaObtenerHistorialEntregas() throws Exception {
            when(entregaService.getHistorialEntregasCliente(1L)).thenReturn(historialEntregas);

            mockMvc.perform(get("/entrega/cliente/1/historial"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].id").value(1))
                    .andExpect(jsonPath("$[0].id_cliente").value(1));

            verify(entregaService).getHistorialEntregasCliente(1L);
        }

        @Test
        @DisplayName("Debería retornar lista vacía cuando cliente no tiene historial")
        void deberiaRetornarListaVacia() throws Exception {
            when(entregaService.getHistorialEntregasCliente(999L)).thenReturn(new ArrayList<>());

            mockMvc.perform(get("/entrega/cliente/999/historial"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(0));
        }
    }

    @Nested
    @DisplayName("Tests de Entregas por Pedido")
    class EntregasPorPedidoTests {

        @Test
        @DisplayName("Debería obtener entregas por ID de pedido")
        void deberiaObtenerEntregasPorPedido() throws Exception {
            when(entregaService.getEntregasByIdPedido(1L)).thenReturn(historialEntregas);

            mockMvc.perform(get("/entrega/pedido/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(1));

            verify(entregaService).getEntregasByIdPedido(1L);
        }

        @Test
        @DisplayName("Debería manejar error al obtener entregas por pedido")
        void deberiaManejarErrorAlObtenerEntregasPorPedido() throws Exception {
            when(entregaService.getEntregasByIdPedido(999L))
                    .thenThrow(new RuntimeException("Pedido no encontrado"));

            mockMvc.perform(get("/entrega/pedido/999"))
                    .andExpect(status().isInternalServerError());
        }
    }

    @Nested
    @DisplayName("Tests de Gestión de Pedidos")
    class GestionPedidosTests {

        @Test
        @DisplayName("Debería obtener todos los pedidos")
        void deberiaObtenerTodosLosPedidos() throws Exception {
            when(entregaService.getPedidos()).thenReturn(Arrays.asList(sesionReparto));

            mockMvc.perform(get("/entrega/pedidos"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(1));

            verify(entregaService).getPedidos();
        }

        @Test
        @DisplayName("Debería retornar lista vacía cuando no hay pedidos")
        void deberiaRetornarListaVaciaCuandoNoHayPedidos() throws Exception {
            when(entregaService.getPedidos()).thenReturn(new ArrayList<>());

            mockMvc.perform(get("/entrega/pedidos"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(0));
        }
    }

    @Nested
    @DisplayName("Tests de Asignación de Driver")
    class AsignacionDriverTests {

        @Test
        @DisplayName("Debería asignar driver a ruta exitosamente")
        void deberiaAsignarDriverExitosamente() throws Exception {
            Map<String, Object> datos = new HashMap<>();
            datos.put("id_ruta", 1L);
            datos.put("id_driver", 100L);

            doNothing().when(entregaService).asignarDriverARuta(1L, 100L);

            mockMvc.perform(post("/entrega/asignar-driver")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(datos)))
                    .andExpect(status().isOk())
                    .andExpect(content().string(org.hamcrest.Matchers.containsString("Driver asignado exitosamente")));

            verify(entregaService).asignarDriverARuta(1L, 100L);
        }

        @Test
        @DisplayName("Debería manejar error al asignar driver")
        void deberiaManejarErrorAlAsignarDriver() throws Exception {
            Map<String, Object> datos = new HashMap<>();
            datos.put("id_ruta", 999L);
            datos.put("id_driver", 100L);

            doThrow(new RuntimeException("Ruta no encontrada"))
                    .when(entregaService).asignarDriverARuta(999L, 100L);

            mockMvc.perform(post("/entrega/asignar-driver")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(datos)))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string(org.hamcrest.Matchers.containsString("Error al asignar driver")));
        }
    }

    @Nested
    @DisplayName("Tests de Rutas Activas")
    class RutasActivasTests {

        @Test
        @DisplayName("Debería obtener rutas activas")
        void deberiaObtenerRutasActivas() throws Exception {
            List<Map<String, Object>> rutasActivas = new ArrayList<>();
            Map<String, Object> ruta = new HashMap<>();
            ruta.put("id", 1L);
            ruta.put("nombre", "Ruta Test");
            rutasActivas.add(ruta);

            when(entregaService.getRutasActivas()).thenReturn(rutasActivas);

            mockMvc.perform(get("/entrega/rutas-activas"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(1));

            verify(entregaService).getRutasActivas();
        }
    }

    @Nested
    @DisplayName("Tests de Creación de Ruta")
    class CreacionRutaTests {

        @Test
        @DisplayName("Debería crear ruta exitosamente")
        void deberiaCrearRutaExitosamente() throws Exception {
            Map<String, Object> datosRuta = new HashMap<>();
            datosRuta.put("nombre", "Nueva Ruta");
            datosRuta.put("latitud", -34.6037);
            datosRuta.put("longitud", -58.3816);

            when(entregaService.crearRuta(anyMap()))
                    .thenReturn("Ruta creada exitosamente");

            mockMvc.perform(post("/entrega/crear-ruta")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(datosRuta)))
                    .andExpect(status().isOk())
                    .andExpect(content().string(org.hamcrest.Matchers.containsString("Ruta creada exitosamente")));

            verify(entregaService).crearRuta(anyMap());
        }
    }
}
