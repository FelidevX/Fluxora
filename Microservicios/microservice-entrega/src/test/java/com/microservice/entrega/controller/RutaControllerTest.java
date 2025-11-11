package com.microservice.entrega.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.microservice.entrega.client.ClienteServiceClient;
import com.microservice.entrega.client.UsuarioServiceClient;
import com.microservice.entrega.dto.ClienteDTO;
import com.microservice.entrega.entity.Ruta;
import com.microservice.entrega.service.RutaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RutaController.class)
@DisplayName("RutaController Tests")
class RutaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RutaService rutaService;

    @MockBean
    private ClienteServiceClient clienteServiceClient;

    @MockBean
    private UsuarioServiceClient usuarioServiceClient;

    private List<ClienteDTO> clientesTest;
    private Ruta rutaTest;

    @BeforeEach
    void setUp() {
        rutaTest = new Ruta();
        rutaTest.setId(1L);
        rutaTest.setLatitud(-34.6037);
        rutaTest.setLongitud(-58.3816);

        ClienteDTO cliente1 = new ClienteDTO();
        cliente1.setId(1L);
        cliente1.setNombre("Cliente 1");
        cliente1.setLatitud(-34.6);
        cliente1.setLongitud(-58.4);

        clientesTest = Arrays.asList(cliente1);
    }

    @Nested
    @DisplayName("Tests de Optimización de Rutas")
    class OptimizacionRutasTests {

        @Test
        @DisplayName("Debería optimizar ruta con OR-Tools exitosamente")
        void deberiaOptimizarRutaConORTools() throws Exception {
            when(rutaService.getClientesDeRuta(1L)).thenReturn(clientesTest);
            when(rutaService.getOptimizedRouteORTools(anyList())).thenReturn(clientesTest);
            when(rutaService.getOrigenRuta(1L)).thenReturn(rutaTest);
            when(rutaService.getOsrmRoute(anyList(), any())).thenReturn("{}");

            mockMvc.perform(get("/rutas/optimized-ortools/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.orderedClients").exists())
                    .andExpect(jsonPath("$.osrmRoute").exists())
                    .andExpect(jsonPath("$.origen").exists());

            verify(rutaService).getClientesDeRuta(1L);
            verify(rutaService).getOptimizedRouteORTools(anyList());
        }

        @Test
        @DisplayName("Debería retornar lista vacía cuando no hay clientes en la ruta")
        void deberiaRetornarListaVaciaCuandoNoHayClientes() throws Exception {
            when(rutaService.getClientesDeRuta(1L)).thenReturn(new ArrayList<>());
            when(rutaService.getOptimizedRouteORTools(anyList())).thenReturn(new ArrayList<>());
            when(rutaService.getOrigenRuta(1L)).thenReturn(rutaTest);
            when(rutaService.getOsrmRoute(anyList(), any())).thenReturn("{}");

            mockMvc.perform(get("/rutas/optimized-ortools/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.orderedClients").isArray())
                    .andExpect(jsonPath("$.orderedClients.length()").value(0));
        }
    }

    @Nested
    @DisplayName("Tests de Gestión de Clientes")
    class GestionClientesTests {

        @Test
        @DisplayName("Debería obtener clientes de una ruta")
        void deberiaObtenerClientesDeRuta() throws Exception {
            when(rutaService.getClientesDeRuta(1L)).thenReturn(clientesTest);

            mockMvc.perform(get("/rutas/clientes/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].id").value(1))
                    .andExpect(jsonPath("$[0].nombre").value("Cliente 1"));

            verify(rutaService).getClientesDeRuta(1L);
        }

        @Test
        @DisplayName("Debería obtener clientes sin ruta asignada")
        void deberiaObtenerClientesSinRuta() throws Exception {
            when(rutaService.getClientesSinRuta()).thenReturn(clientesTest);

            mockMvc.perform(get("/rutas/clientes-sin-ruta"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(1));

            verify(rutaService).getClientesSinRuta();
        }

        @Test
        @DisplayName("Debería retornar lista vacía cuando no hay clientes sin ruta")
        void deberiaRetornarListaVaciaCuandoNoHayClientesSinRuta() throws Exception {
            when(rutaService.getClientesSinRuta()).thenReturn(new ArrayList<>());

            mockMvc.perform(get("/rutas/clientes-sin-ruta"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(0));
        }
    }

    @Nested
    @DisplayName("Tests de Gestión de Rutas")
    class GestionRutasTests {

        @Test
        @DisplayName("Debería obtener todas las rutas")
        void deberiaObtenerTodasLasRutas() throws Exception {
            when(rutaService.getAllRutas()).thenReturn(Arrays.asList(rutaTest));

            mockMvc.perform(get("/rutas"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(1));

            verify(rutaService).getAllRutas();
        }

        @Test
        @DisplayName("Debería retornar lista vacía cuando no hay rutas")
        void deberiaRetornarListaVaciaCuandoNoHayRutas() throws Exception {
            when(rutaService.getAllRutas()).thenReturn(new ArrayList<>());

            mockMvc.perform(get("/rutas"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(0));
        }
    }

    @Nested
    @DisplayName("Tests de Asignación de Clientes")
    class AsignacionClientesTests {

        @Test
        @DisplayName("Debería asignar cliente a ruta exitosamente")
        void deberiaAsignarClienteARutaExitosamente() throws Exception {
            Map<String, Long> request = new HashMap<>();
            request.put("id_ruta", 1L);
            request.put("id_cliente", 1L);

            doNothing().when(rutaService).asignarClienteARuta(1L, 1L);

            mockMvc.perform(post("/rutas/asignar-cliente")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(content().string(org.hamcrest.Matchers.containsString("Cliente asignado correctamente")));

            verify(rutaService).asignarClienteARuta(1L, 1L);
        }

        @Test
        @DisplayName("Debería manejar error cuando ruta no existe")
        void deberiaManejarErrorCuandoRutaNoExiste() throws Exception {
            Map<String, Long> request = new HashMap<>();
            request.put("id_ruta", 999L);
            request.put("id_cliente", 1L);

            doThrow(new RuntimeException("Ruta no encontrada"))
                    .when(rutaService).asignarClienteARuta(999L, 1L);

            mockMvc.perform(post("/rutas/asignar-cliente")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string(org.hamcrest.Matchers.containsString("Error al asignar el cliente")));
        }

        @Test
        @DisplayName("Debería manejar error cuando cliente ya está asignado")
        void deberiaManejarErrorCuandoClienteYaAsignado() throws Exception {
            Map<String, Long> request = new HashMap<>();
            request.put("id_ruta", 1L);
            request.put("id_cliente", 1L);

            doThrow(new RuntimeException("Cliente ya está asignado a una ruta"))
                    .when(rutaService).asignarClienteARuta(1L, 1L);

            mockMvc.perform(post("/rutas/asignar-cliente")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Tests de Driver y Rutas")
    class DriverRutasTests {

        @Test
        @DisplayName("Debería obtener ruta por ID de driver")
        void deberiaObtenerRutaPorIdDriver() throws Exception {
            when(rutaService.getRutaIdByDriverId(100L)).thenReturn(1L);

            mockMvc.perform(get("/rutas/driver/100"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.rutaId").value(1));

            verify(rutaService).getRutaIdByDriverId(100L);
        }

        @Test
        @DisplayName("Debería manejar error cuando driver no tiene ruta asignada")
        void deberiaManejarErrorCuandoDriverSinRuta() throws Exception {
            when(rutaService.getRutaIdByDriverId(999L))
                    .thenThrow(new RuntimeException("Driver no tiene ruta asignada"));

            mockMvc.perform(get("/rutas/driver/999"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").exists());
        }
    }

    @Nested
    @DisplayName("Tests de Inicio y Finalización de Rutas")
    class InicioFinalizacionRutasTests {

        @Test
        @DisplayName("Debería iniciar ruta exitosamente")
        void deberiaIniciarRutaExitosamente() throws Exception {
            when(rutaService.iniciarRuta(1L)).thenReturn(1L);

            mockMvc.perform(post("/rutas/iniciar/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Ruta iniciada correctamente"))
                    .andExpect(jsonPath("$.id_pedido").value(1));

            verify(rutaService).iniciarRuta(1L);
        }

        @Test
        @DisplayName("Debería manejar error al iniciar ruta")
        void deberiaManejarErrorAlIniciarRuta() throws Exception {
            when(rutaService.iniciarRuta(999L))
                    .thenThrow(new RuntimeException("No se pudo iniciar la ruta"));

            mockMvc.perform(post("/rutas/iniciar/999"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Debería finalizar ruta exitosamente")
        void deberiaFinalizarRutaExitosamente() throws Exception {
            doNothing().when(rutaService).finalizarRuta(1L);

            mockMvc.perform(post("/rutas/finalizar/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Ruta finalizada correctamente"));

            verify(rutaService).finalizarRuta(1L);
        }

        @Test
        @DisplayName("Debería manejar error al finalizar ruta")
        void deberiaManejarErrorAlFinalizarRuta() throws Exception {
            doThrow(new RuntimeException("No se pudo finalizar la ruta"))
                    .when(rutaService).finalizarRuta(999L);

            mockMvc.perform(post("/rutas/finalizar/999"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Tests de Validación de Datos")
    class ValidacionDatosTests {

        @Test
        @DisplayName("Debería procesar request incluso sin id_ruta (el controller no valida)")
        void deberiaValidarIdRutaNoNulo() throws Exception {
            Map<String, Long> request = new HashMap<>();
            request.put("id_cliente", 1L);
            
            doThrow(new RuntimeException("id_ruta es requerido"))
                    .when(rutaService).asignarClienteARuta(isNull(), eq(1L));

            mockMvc.perform(post("/rutas/asignar-cliente")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Debería procesar request incluso sin id_cliente (el controller no valida)")
        void deberiaValidarIdClienteNoNulo() throws Exception {
            Map<String, Long> request = new HashMap<>();
            request.put("id_ruta", 1L);
            
            doThrow(new RuntimeException("id_cliente es requerido"))
                    .when(rutaService).asignarClienteARuta(eq(1L), isNull());

            mockMvc.perform(post("/rutas/asignar-cliente")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Debería asignar correctamente cuando ambos campos están presentes")
        void deberiaAsignarCuandoAmbosValoresPresentes() throws Exception {
            Map<String, Long> request = new HashMap<>();
            request.put("id_ruta", 1L);
            request.put("id_cliente", 1L);

            doNothing().when(rutaService).asignarClienteARuta(1L, 1L);

            mockMvc.perform(post("/rutas/asignar-cliente")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());

            verify(rutaService).asignarClienteARuta(1L, 1L);
        }
    }
}