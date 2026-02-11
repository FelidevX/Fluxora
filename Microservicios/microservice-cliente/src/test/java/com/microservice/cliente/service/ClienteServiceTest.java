package com.microservice.cliente.service;

import com.microservice.cliente.client.EntregaServiceClient;
import com.microservice.cliente.dto.ClienteDTO;
import com.microservice.cliente.entity.Cliente;
import com.microservice.cliente.repository.ClienteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ClienteService Tests")
class ClienteServiceTest {

    @Mock
    private ClienteRepository clienteRepository;

    @Mock
    private EntregaServiceClient entregaServiceClient;

    @InjectMocks
    private ClienteService clienteService;

    private Cliente clienteTest;
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

        Cliente cliente2 = new Cliente();
        cliente2.setId(2L);
        cliente2.setNombre("Cliente 2");
        cliente2.setNombreNegocio("Negocio 2");
        cliente2.setDireccion("Avenida Test 456");
        cliente2.setContacto("987654321");
        cliente2.setEmail("test2@test.com");
        cliente2.setLatitud(-34.6100);
        cliente2.setLongitud(-58.3900);
        cliente2.setPrecioCorriente(55.0);
        cliente2.setPrecioEspecial(65.0);

        clientesTest = Arrays.asList(clienteTest, cliente2);
    }

    @Test
    @DisplayName("Debería obtener todos los clientes")
    void testGetAllClientes() {
        // Arrange
        when(clienteRepository.findAll()).thenReturn(clientesTest);

        // Act
        List<Cliente> resultado = clienteService.getAllClientes();

        // Assert
        assertNotNull(resultado);
        assertEquals(2, resultado.size());
        assertEquals("Cliente Test", resultado.get(0).getNombre());
        verify(clienteRepository).findAll();
    }

    @Test
    @DisplayName("Debería retornar lista vacía cuando no hay clientes")
    void testGetAllClientes_Empty() {
        // Arrange
        when(clienteRepository.findAll()).thenReturn(Arrays.asList());

        // Act
        List<Cliente> resultado = clienteService.getAllClientes();

        // Assert
        assertNotNull(resultado);
        assertTrue(resultado.isEmpty());
        verify(clienteRepository).findAll();
    }

    @Test
    @DisplayName("Debería agregar un cliente exitosamente")
    void testAddCliente_Success() {
        // Arrange
        when(clienteRepository.save(any(Cliente.class))).thenReturn(clienteTest);

        // Act
        Cliente resultado = clienteService.addCliente(clienteTest);

        // Assert
        assertNotNull(resultado);
        assertEquals(1L, resultado.getId());
        assertEquals("Cliente Test", resultado.getNombre());
        assertEquals("test@test.com", resultado.getEmail());
        verify(clienteRepository).save(clienteTest);
    }

    @Test
    @DisplayName("Debería obtener clientes por IDs")
    void testGetClienteByIds() {
        // Arrange
        List<Long> ids = Arrays.asList(1L, 2L);
        when(clienteRepository.findAllById(ids)).thenReturn(clientesTest);

        // Act
        List<ClienteDTO> resultado = clienteService.getClienteByIds(ids);

        // Assert
        assertNotNull(resultado);
        assertEquals(2, resultado.size());
        assertEquals("Cliente Test", resultado.get(0).getNombre());
        assertEquals("test@test.com", resultado.get(0).getEmail());
        assertEquals(50.0, resultado.get(0).getPrecioCorriente());
        verify(clienteRepository).findAllById(ids);
    }

    @Test
    @DisplayName("Debería retornar lista vacía cuando no encuentra clientes por IDs")
    void testGetClienteByIds_Empty() {
        // Arrange
        List<Long> ids = Arrays.asList(999L, 888L);
        when(clienteRepository.findAllById(ids)).thenReturn(Arrays.asList());

        // Act
        List<ClienteDTO> resultado = clienteService.getClienteByIds(ids);

        // Assert
        assertNotNull(resultado);
        assertTrue(resultado.isEmpty());
        verify(clienteRepository).findAllById(ids);
    }

    @Test
    @DisplayName("Debería obtener cliente por ID")
    void testGetClienteById_Found() {
        // Arrange
        when(clienteRepository.findById(1L)).thenReturn(Optional.of(clienteTest));

        // Act
        ClienteDTO resultado = clienteService.getClienteById(1L);

        // Assert
        assertNotNull(resultado);
        assertEquals(1L, resultado.getId());
        assertEquals("Cliente Test", resultado.getNombre());
        assertEquals("Calle Falsa 123", resultado.getDireccion());
        assertEquals(-34.6037, resultado.getLatitud());
        assertEquals(-58.3816, resultado.getLongitud());
        verify(clienteRepository).findById(1L);
    }

    @Test
    @DisplayName("Debería retornar null cuando no encuentra cliente por ID")
    void testGetClienteById_NotFound() {
        // Arrange
        when(clienteRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        ClienteDTO resultado = clienteService.getClienteById(999L);

        // Assert
        assertNull(resultado);
        verify(clienteRepository).findById(999L);
    }

    @Test
    @DisplayName("Debería eliminar cliente exitosamente")
    void testDeleteCliente_Success() {
        // Arrange
        when(clienteRepository.findById(1L)).thenReturn(Optional.of(clienteTest));
        when(entregaServiceClient.eliminarRelacionesCliente(1L))
            .thenReturn(ResponseEntity.ok("Relaciones eliminadas"));
        doNothing().when(clienteRepository).deleteById(1L);

        // Act & Assert
        assertDoesNotThrow(() -> clienteService.deleteCliente(1L));
        
        verify(clienteRepository).findById(1L);
        verify(entregaServiceClient).eliminarRelacionesCliente(1L);
        verify(clienteRepository).deleteById(1L);
    }

    @Test
    @DisplayName("Debería lanzar excepción cuando cliente no existe al eliminar")
    void testDeleteCliente_NotFound() {
        // Arrange
        when(clienteRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> clienteService.deleteCliente(999L));
        
        assertTrue(exception.getMessage().contains("Cliente no encontrado"));
        verify(clienteRepository).findById(999L);
        verify(entregaServiceClient, never()).eliminarRelacionesCliente(anyLong());
        verify(clienteRepository, never()).deleteById(anyLong());
    }

    @Test
    @DisplayName("Debería manejar error al eliminar relaciones con entregas")
    void testDeleteCliente_ErrorDeletingRelations() {
        // Arrange
        when(clienteRepository.findById(1L)).thenReturn(Optional.of(clienteTest));
        when(entregaServiceClient.eliminarRelacionesCliente(1L))
            .thenThrow(new RuntimeException("Error al comunicarse con microservicio de entregas"));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> clienteService.deleteCliente(1L));
        
        assertTrue(exception.getMessage().contains("Error al eliminar cliente"));
        verify(clienteRepository).findById(1L);
        verify(entregaServiceClient).eliminarRelacionesCliente(1L);
        verify(clienteRepository, never()).deleteById(anyLong());
    }

    @Test
    @DisplayName("Debería convertir correctamente Cliente a ClienteDTO")
    void testClienteDTOMapping() {
        // Arrange
        when(clienteRepository.findById(1L)).thenReturn(Optional.of(clienteTest));

        // Act
        ClienteDTO resultado = clienteService.getClienteById(1L);

        // Assert
        assertNotNull(resultado);
        assertEquals(clienteTest.getId(), resultado.getId());
        assertEquals(clienteTest.getNombre(), resultado.getNombre());
        assertEquals(clienteTest.getDireccion(), resultado.getDireccion());
        assertEquals(clienteTest.getLatitud(), resultado.getLatitud());
        assertEquals(clienteTest.getLongitud(), resultado.getLongitud());
        assertEquals(clienteTest.getEmail(), resultado.getEmail());
        assertEquals(clienteTest.getPrecioCorriente(), resultado.getPrecioCorriente());
        assertEquals(clienteTest.getPrecioEspecial(), resultado.getPrecioEspecial());
    }

    @Test
    @DisplayName("Debería obtener coordenadas correctamente")
    void testGetCoordenadas() {
        // Act
        double[] coordenadas = clienteTest.getCoordenadas();

        // Assert
        assertNotNull(coordenadas);
        assertEquals(2, coordenadas.length);
        assertEquals(-34.6037, coordenadas[0]);
        assertEquals(-58.3816, coordenadas[1]);
    }

    @Test
    @DisplayName("Debería manejar coordenadas nulas")
    void testGetCoordenadas_Null() {
        // Arrange
        Cliente clienteSinCoordenadas = new Cliente();
        clienteSinCoordenadas.setId(3L);
        clienteSinCoordenadas.setNombre("Sin Coordenadas");

        // Act
        double[] coordenadas = clienteSinCoordenadas.getCoordenadas();

        // Assert
        assertNotNull(coordenadas);
        assertEquals(2, coordenadas.length);
        assertEquals(0.0, coordenadas[0]);
        assertEquals(0.0, coordenadas[1]);
    }
}
