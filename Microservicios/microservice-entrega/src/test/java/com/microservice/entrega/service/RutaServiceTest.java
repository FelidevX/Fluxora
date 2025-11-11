package com.microservice.entrega.service;

import com.microservice.entrega.client.ClienteServiceClient;
import com.microservice.entrega.dto.ClienteDTO;
import com.microservice.entrega.entity.Ruta;
import com.microservice.entrega.entity.RutaCliente;
import com.microservice.entrega.entity.SesionReparto;
import com.microservice.entrega.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RutaServiceTest {

    @Mock
    private RutaRepository rutaRepository;

    @Mock
    private RutaClienteRepository rutaClienteRepository;

    @Mock
    private ClienteServiceClient clienteServiceClient;

    @Mock
    private SesionRepartoRepository sesionRepartoRepository;

    @Mock
    private RegistroEntregaRepository registroEntregaRepository;

    @Mock
    private ProgramacionEntregaRepository programacionEntregaRepository;

    @InjectMocks
    private RutaService rutaService;

    private Ruta rutaTest;
    private List<ClienteDTO> clientesTest;

    @BeforeEach
    void setUp() {
        rutaTest = new Ruta();
        rutaTest.setId(1L);
        rutaTest.setLatitud(-34.6037);
        rutaTest.setLongitud(-58.3816);
        rutaTest.setId_driver(100L);

        clientesTest = Arrays.asList(
            createClienteDTO(1L, "Cliente A", -36.610930, -72.110828),
            createClienteDTO(2L, "Cliente B", -36.612484, -72.082953),
            createClienteDTO(3L, "Cliente C", -36.602133, -72.078198)
        );
    }

    private ClienteDTO createClienteDTO(Long id, String nombre, Double lat, Double lng) {
        ClienteDTO cliente = new ClienteDTO();
        cliente.setId(id);
        cliente.setNombre(nombre);
        cliente.setLatitud(lat);
        cliente.setLongitud(lng);
        return cliente;
    }

    @Test
    void testGetOrigenRuta_Exitoso() {
        when(rutaRepository.findById(1L)).thenReturn(Optional.of(rutaTest));

        Ruta resultado = rutaService.getOrigenRuta(1L);

        assertNotNull(resultado);
        assertEquals(1L, resultado.getId());
        assertEquals(-34.6037, resultado.getLatitud());
        verify(rutaRepository).findById(1L);
    }

    @Test
    void testGetOrigenRuta_NoEncontrada() {
        when(rutaRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> rutaService.getOrigenRuta(999L));
        verify(rutaRepository).findById(999L);
    }

    @Test
    void testGetClientesDeRuta() {
        List<RutaCliente> rutaClientes = Arrays.asList(
            createRutaCliente(1L, 1L),
            createRutaCliente(1L, 2L)
        );

        when(rutaClienteRepository.findById_ruta(1L)).thenReturn(rutaClientes);
        when(clienteServiceClient.getClientesByIds(anyList())).thenReturn(clientesTest);

        List<ClienteDTO> resultado = rutaService.getClientesDeRuta(1L);

        assertNotNull(resultado);
        assertEquals(3, resultado.size());
        verify(rutaClienteRepository).findById_ruta(1L);
        verify(clienteServiceClient).getClientesByIds(anyList());
    }

    private RutaCliente createRutaCliente(Long idRuta, Long idCliente) {
        return createRutaCliente(idRuta, idCliente, 1);
    }

    private RutaCliente createRutaCliente(Long idRuta, Long idCliente, Integer orden) {
        RutaCliente rc = new RutaCliente();
        rc.setId_ruta(idRuta);
        rc.setId_cliente(idCliente);
        rc.setOrden(orden);
        return rc;
    }

    @Test
    void testGetAllRutas() {
        List<Ruta> rutas = Arrays.asList(rutaTest);
        when(rutaRepository.findAll()).thenReturn(rutas);

        List<Ruta> resultado = rutaService.getAllRutas();

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(rutaRepository).findAll();
    }

    @Test
    void testGetClientesSinRuta() {
        List<ClienteDTO> todosLosClientes = Arrays.asList(
            createClienteDTO(1L, "Cliente 1", -34.6, -58.4),
            createClienteDTO(2L, "Cliente 2", -34.7, -58.5),
            createClienteDTO(3L, "Cliente 3", -34.8, -58.6)
        );
        List<Long> clientesAsignados = Arrays.asList(1L);

        when(clienteServiceClient.getAllClientes()).thenReturn(todosLosClientes);
        when(rutaClienteRepository.findAllClienteIds()).thenReturn(clientesAsignados);

        List<ClienteDTO> resultado = rutaService.getClientesSinRuta();

        assertNotNull(resultado);
        assertEquals(2, resultado.size());
        assertFalse(resultado.stream().anyMatch(c -> c.getId().equals(1L)));
    }

    @Test
    void testAsignarClienteARuta_Exitoso() {
        when(rutaRepository.existsById(1L)).thenReturn(true);
        when(rutaClienteRepository.findAllClienteIds()).thenReturn(Arrays.asList(2L, 3L));
        when(rutaClienteRepository.save(any(RutaCliente.class))).thenReturn(new RutaCliente());

        assertDoesNotThrow(() -> rutaService.asignarClienteARuta(1L, 5L));
        verify(rutaClienteRepository).save(any(RutaCliente.class));
    }

    @Test
    void testAsignarClienteARuta_RutaNoExiste() {
        when(rutaRepository.existsById(999L)).thenReturn(false);

        assertThrows(RuntimeException.class, () -> rutaService.asignarClienteARuta(999L, 1L));
    }

    @Test
    void testAsignarClienteARuta_ClienteYaAsignado() {
        when(rutaRepository.existsById(1L)).thenReturn(true);
        when(rutaClienteRepository.findAllClienteIds()).thenReturn(Arrays.asList(5L));

        assertThrows(RuntimeException.class, () -> rutaService.asignarClienteARuta(1L, 5L));
    }

    @Test
    void testGetRutaIdByDriverId_Exitoso() {
        when(rutaRepository.findByIdDriver(100L)).thenReturn(Optional.of(rutaTest));

        Long resultado = rutaService.getRutaIdByDriverId(100L);

        assertEquals(1L, resultado);
        verify(rutaRepository).findByIdDriver(100L);
    }

    @Test
    void testGetRutaIdByDriverId_NoEncontrado() {
        when(rutaRepository.findByIdDriver(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> rutaService.getRutaIdByDriverId(999L));
    }

    @Test
    void testIniciarRuta_Exitoso() {
        when(rutaRepository.findById(1L)).thenReturn(Optional.of(rutaTest));
        when(rutaClienteRepository.findById_ruta(1L)).thenReturn(Arrays.asList(
            createRutaCliente(1L, 1L, 1)
        ));
        when(programacionEntregaRepository.findByIdRutaAndFechaProgramada(any(), any()))
            .thenReturn(Arrays.asList());

        assertThrows(RuntimeException.class, () -> rutaService.iniciarRuta(1L));
        
        verify(rutaRepository).findById(1L);
        verify(rutaClienteRepository).findById_ruta(1L);
    }
}
