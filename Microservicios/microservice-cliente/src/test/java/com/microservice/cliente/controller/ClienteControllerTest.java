package com.microservice.cliente.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.microservice.cliente.dto.ClienteDTO;
import com.microservice.cliente.entity.Cliente;
import com.microservice.cliente.service.ClienteService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = ClienteController.class, 
    excludeAutoConfiguration = {
        org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class
    })
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("ClienteController Tests")
class ClienteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ClienteService clienteService;

    @MockBean
    private com.microservice.cliente.repository.ClienteRepository clienteRepository;

    @MockBean
    private com.microservice.cliente.client.EntregaServiceClient entregaServiceClient;

    @MockBean
    private com.microservice.cliente.security.JwtUtils jwtUtils;

    @MockBean
    private com.microservice.cliente.security.JwtAuthenticationFilter jwtAuthenticationFilter;

    private Cliente clienteTest;
    private ClienteDTO clienteDTOTest;
    private List<Cliente> clientesTest;

    @BeforeEach
    void setUp() {
        clienteTest = new Cliente();
        clienteTest.setId(1L);
        clienteTest.setNombre("Cliente Test");
        clienteTest.setNombreNegocio("Negocio Test");
        clienteTest.setDireccion("Calle Falsa 123");
        clienteTest.setContacto("123456789");
        clienteTest.setEmail("test@test.com");
        clienteTest.setLatitud(-34.6037);
        clienteTest.setLongitud(-58.3816);
        clienteTest.setPrecioCorriente(50.0);
        clienteTest.setPrecioEspecial(60.0);

        clienteDTOTest = new ClienteDTO();
        clienteDTOTest.setId(1L);
        clienteDTOTest.setNombre("Cliente Test");
        clienteDTOTest.setDireccion("Calle Falsa 123");
        clienteDTOTest.setLatitud(-34.6037);
        clienteDTOTest.setLongitud(-58.3816);
        clienteDTOTest.setEmail("test@test.com");
        clienteDTOTest.setPrecioCorriente(50.0);
        clienteDTOTest.setPrecioEspecial(60.0);

        Cliente cliente2 = new Cliente();
        cliente2.setId(2L);
        cliente2.setNombre("Cliente 2");
        cliente2.setDireccion("Avenida Test 456");

        clientesTest = Arrays.asList(clienteTest, cliente2);
    }

    @Nested
    @DisplayName("Tests de obtención de clientes")
    class ObtenerClientesTests {

        @Test
        @DisplayName("Debería obtener todos los clientes")
        void deberiaObtenerTodosLosClientes() throws Exception {
            when(clienteService.getAllClientes()).thenReturn(clientesTest);

            mockMvc.perform(get("/clientes"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].nombre").value("Cliente Test"))
                    .andExpect(jsonPath("$[0].email").value("test@test.com"));

            verify(clienteService).getAllClientes();
        }

        @Test
        @DisplayName("Debería retornar lista vacía cuando no hay clientes")
        void deberiaRetornarListaVacia() throws Exception {
            when(clienteService.getAllClientes()).thenReturn(Arrays.asList());

            mockMvc.perform(get("/clientes"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(0));

            verify(clienteService).getAllClientes();
        }

        @Test
        @DisplayName("Debería obtener cliente por ID")
        void deberiaObtenerClientePorId() throws Exception {
            when(clienteService.getClienteById(1L)).thenReturn(clienteDTOTest);

            mockMvc.perform(get("/clientes/cliente/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.nombre").value("Cliente Test"))
                    .andExpect(jsonPath("$.direccion").value("Calle Falsa 123"))
                    .andExpect(jsonPath("$.email").value("test@test.com"))
                    .andExpect(jsonPath("$.latitud").value(-34.6037))
                    .andExpect(jsonPath("$.longitud").value(-58.3816));

            verify(clienteService).getClienteById(1L);
        }

        @Test
        @DisplayName("Debería retornar null cuando cliente no existe")
        void deberiaRetornarNullCuandoNoExiste() throws Exception {
            when(clienteService.getClienteById(999L)).thenReturn(null);

            mockMvc.perform(get("/clientes/cliente/999"))
                    .andExpect(status().isOk())
                    .andExpect(content().string(""));

            verify(clienteService).getClienteById(999L);
        }

        @Test
        @DisplayName("Debería obtener clientes por IDs")
        void deberiaObtenerClientesPorIds() throws Exception {
            List<ClienteDTO> clientesDTO = Arrays.asList(clienteDTOTest);
            when(clienteService.getClienteByIds(anyList())).thenReturn(clientesDTO);

            mockMvc.perform(get("/clientes/1,2"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].id").value(1));

            verify(clienteService).getClienteByIds(anyList());
        }
    }

    @Nested
    @DisplayName("Tests de creación de clientes")
    class CrearClienteTests {

        @Test
        @DisplayName("Debería crear cliente exitosamente")
        void deberiaCrearClienteExitosamente() throws Exception {
            when(clienteService.addCliente(any(Cliente.class))).thenReturn(clienteTest);

            mockMvc.perform(post("/clientes")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(clienteTest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.nombre").value("Cliente Test"))
                    .andExpect(jsonPath("$.email").value("test@test.com"));

            verify(clienteService).addCliente(any(Cliente.class));
        }

        @Test
        @DisplayName("Debería crear cliente con todos los campos")
        void deberiaCrearClienteConTodosCampos() throws Exception {
            when(clienteService.addCliente(any(Cliente.class))).thenReturn(clienteTest);

            mockMvc.perform(post("/clientes")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(clienteTest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.nombre").value("Cliente Test"))
                    .andExpect(jsonPath("$.nombreNegocio").value("Negocio Test"))
                    .andExpect(jsonPath("$.direccion").value("Calle Falsa 123"))
                    .andExpect(jsonPath("$.contacto").value("123456789"))
                    .andExpect(jsonPath("$.precioCorriente").value(50.0))
                    .andExpect(jsonPath("$.precioEspecial").value(60.0));

            verify(clienteService).addCliente(any(Cliente.class));
        }
    }

    @Nested
    @DisplayName("Tests de eliminación de clientes")
    class EliminarClienteTests {

        @Test
        @DisplayName("Debería eliminar cliente exitosamente")
        void deberiaEliminarClienteExitosamente() throws Exception {
            doNothing().when(clienteService).deleteCliente(1L);

            mockMvc.perform(delete("/clientes/1"))
                    .andExpect(status().isOk())
                    .andExpect(content().string("Cliente eliminado exitosamente"));

            verify(clienteService).deleteCliente(1L);
        }

        @Test
        @DisplayName("Debería manejar error cuando cliente no existe")
        void deberiaManejarErrorClienteNoExiste() throws Exception {
            doThrow(new RuntimeException("Cliente no encontrado con ID: 999"))
                    .when(clienteService).deleteCliente(999L);

            mockMvc.perform(delete("/clientes/999"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string(org.hamcrest.Matchers
                            .containsString("Error al eliminar cliente")));

            verify(clienteService).deleteCliente(999L);
        }

        @Test
        @DisplayName("Debería manejar error al eliminar relaciones")
        void deberiaManejarErrorAlEliminarRelaciones() throws Exception {
            doThrow(new RuntimeException("Error al comunicarse con microservicio de entregas"))
                    .when(clienteService).deleteCliente(1L);

            mockMvc.perform(delete("/clientes/1"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string(org.hamcrest.Matchers
                            .containsString("Error al eliminar cliente")));

            verify(clienteService).deleteCliente(1L);
        }
    }

    @Nested
    @DisplayName("Tests de validación de datos")
    class ValidacionDatosTests {

        @Test
        @DisplayName("Debería aceptar cliente con coordenadas válidas")
        void deberiaAceptarClienteConCoordenadasValidas() throws Exception {
            when(clienteService.addCliente(any(Cliente.class))).thenReturn(clienteTest);

            mockMvc.perform(post("/clientes")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(clienteTest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.latitud").value(-34.6037))
                    .andExpect(jsonPath("$.longitud").value(-58.3816));

            verify(clienteService).addCliente(any(Cliente.class));
        }

        @Test
        @DisplayName("Debería aceptar cliente con precios válidos")
        void deberiaAceptarClienteConPreciosValidos() throws Exception {
            when(clienteService.addCliente(any(Cliente.class))).thenReturn(clienteTest);

            mockMvc.perform(post("/clientes")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(clienteTest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.precioCorriente").value(50.0))
                    .andExpect(jsonPath("$.precioEspecial").value(60.0));

            verify(clienteService).addCliente(any(Cliente.class));
        }
    }

    @Nested
    @DisplayName("Tests de casos límite")
    class CasosLimiteTests {

        @Test
        @DisplayName("Debería manejar múltiples IDs en la búsqueda")
        void deberiaManejarMultiplesIds() throws Exception {
            List<ClienteDTO> clientesDTO = Arrays.asList(clienteDTOTest, clienteDTOTest);
            when(clienteService.getClienteByIds(anyList())).thenReturn(clientesDTO);

            mockMvc.perform(get("/clientes/1,2,3"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(2));

            verify(clienteService).getClienteByIds(anyList());
        }

        @Test
        @DisplayName("Debería retornar lista vacía con IDs inexistentes")
        void deberiaRetornarListaVaciaConIdsInexistentes() throws Exception {
            when(clienteService.getClienteByIds(anyList())).thenReturn(Arrays.asList());

            mockMvc.perform(get("/clientes/999,888"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(0));

            verify(clienteService).getClienteByIds(anyList());
        }
    }
}
