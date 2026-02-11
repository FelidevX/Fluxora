package com.microservice.entrega.service;

import com.microservice.entrega.client.ClienteServiceClient;
import com.microservice.entrega.client.InventarioServiceClient;
import com.microservice.entrega.dto.ClienteDTO;
import com.microservice.entrega.dto.ProductoEntregadoDTO;
import com.microservice.entrega.dto.RegistroEntregaDTO;
import com.microservice.entrega.entity.*;
import com.microservice.entrega.repository.*;
import com.microservice.entrega.util.EmailTemplateGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EntregaServiceTest {

    @Mock
    private RutaRepository rutaRepository;

    @Mock
    private RutaClienteRepository rutaClienteRepository;

    @Mock
    private ProgramacionEntregaRepository programacionEntregaRepository;

    @Mock
    private RegistroEntregaRepository registroEntregaRepository;

    @Mock
    private ClienteServiceClient clienteServiceClient;

    @Mock
    private SesionRepartoRepository sesionRepartoRepository;

    @Mock
    private InventarioServiceClient inventarioServiceClient;

    @Mock
    private EmailService emailService;

    @Mock
    private EmailTemplateGenerator emailTemplateGenerator;

    @InjectMocks
    private EntregaService entregaService;

    private RegistroEntregaDTO registroEntregaDTO;
    private ClienteDTO clienteDTO;
    private SesionReparto sesionReparto;

    @BeforeEach
    void setUp() {
        clienteDTO = new ClienteDTO();
        clienteDTO.setId(1L);
        clienteDTO.setNombre("Cliente Test");
        clienteDTO.setEmail("test@test.com");

        // Configurar productos con la estructura correcta incluyendo lotes
        ProductoEntregadoDTO producto = new ProductoEntregadoDTO();
        producto.setId_producto(1L);
        producto.setId_lote(10L);  // ID del lote
        producto.setNombreProducto("Pan Corriente");
        producto.setTipoProducto("corriente");
        producto.setCantidad_kg(10.0);

        registroEntregaDTO = new RegistroEntregaDTO();
        registroEntregaDTO.setId_pedido(1L);
        registroEntregaDTO.setId_cliente(1L);
        registroEntregaDTO.setProductos(Arrays.asList(producto));
        registroEntregaDTO.setCorriente_entregado(10.0);
        registroEntregaDTO.setEspecial_entregado(0.0);
        registroEntregaDTO.setPrecio_corriente(50.0);
        registroEntregaDTO.setPrecio_especial(80.0);
        registroEntregaDTO.setHora_entregada(LocalDateTime.now());
        registroEntregaDTO.setComentario("Entrega test");

        sesionReparto = new SesionReparto();
        sesionReparto.setId(1L);
        sesionReparto.setId_driver(100L);
        sesionReparto.setFecha(LocalDate.now());
        sesionReparto.setKg_corriente(50.0);
        sesionReparto.setKg_especial(30.0);
    }

    @Test
    @SuppressWarnings({"rawtypes", "unchecked"})
    void testRegistrarEntrega_Exitoso() {
        // Mock ResponseEntity para descontarInventario
        ResponseEntity responseEntity = ResponseEntity.ok().build();
        ResponseEntity responseLote = ResponseEntity.ok(Map.of("id", 10L, "productoId", 1L));
        ResponseEntity responseProducto = ResponseEntity.ok(Map.of("id", 1L, "nombre", "Pan Corriente"));
        
        when(clienteServiceClient.getClienteById(1L)).thenReturn(clienteDTO);
        when(inventarioServiceClient.descontarInventario(anyLong(), anyMap()))
            .thenReturn(responseEntity);
        when(inventarioServiceClient.getLoteById(anyLong()))
            .thenReturn(responseLote);
        when(inventarioServiceClient.getProductoById(anyLong()))
            .thenReturn(responseProducto);
        when(registroEntregaRepository.save(any(RegistroEntrega.class)))
            .thenReturn(new RegistroEntrega());
        doNothing().when(emailService).enviarEmailSimple(anyString(), anyString(), anyString());

        assertDoesNotThrow(() -> entregaService.registrarEntrega(registroEntregaDTO));
        verify(registroEntregaRepository).save(any(RegistroEntrega.class));
        verify(clienteServiceClient).getClienteById(1L);
        verify(inventarioServiceClient).descontarInventario(anyLong(), anyMap());
    }

    @Test
    void testRegistrarEntrega_IdPedidoNulo() {
        registroEntregaDTO.setId_pedido(null);

        assertThrows(RuntimeException.class, 
            () -> entregaService.registrarEntrega(registroEntregaDTO));
        verify(registroEntregaRepository, never()).save(any());
    }

    @Test
    void testRegistrarEntrega_ProductosVacios() {
        registroEntregaDTO.setProductos(new ArrayList<>());

        assertThrows(RuntimeException.class, 
            () -> entregaService.registrarEntrega(registroEntregaDTO));
        verify(registroEntregaRepository, never()).save(any());
    }

    @Test
    void testGetHistorialEntregasCliente() {
        List<RegistroEntrega> entregas = Arrays.asList(
            createRegistroEntrega(1L, 1L),
            createRegistroEntrega(2L, 1L)
        );

        when(registroEntregaRepository.findByIdCliente(1L)).thenReturn(entregas);

        List<RegistroEntrega> resultado = entregaService.getHistorialEntregasCliente(1L);

        assertNotNull(resultado);
        assertEquals(2, resultado.size());
        verify(registroEntregaRepository).findByIdCliente(1L);
    }

    private RegistroEntrega createRegistroEntrega(Long id, Long idCliente) {
        RegistroEntrega registro = new RegistroEntrega();
        registro.setId(id);
        registro.setId_cliente(idCliente);
        registro.setId_pedido(1L);
        registro.setHora_entregada(LocalDateTime.now());
        registro.setCorriente_entregado(10.0);
        registro.setEspecial_entregado(5.0);
        registro.setMonto_corriente(500.0);
        registro.setMonto_especial(400.0);
        registro.setMonto_total(900.0);
        return registro;
    }

    @Test
    void testAsignarDriverARuta() {
        Ruta ruta = new Ruta();
        ruta.setId(1L);

        when(rutaRepository.findById(1L)).thenReturn(Optional.of(ruta));
        when(rutaRepository.save(any(Ruta.class))).thenReturn(ruta);

        assertDoesNotThrow(() -> entregaService.asignarDriverARuta(1L, 100L));
        verify(rutaRepository).save(any(Ruta.class));
    }

    @Test
    void testAsignarDriverARuta_RutaNoEncontrada() {
        when(rutaRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, 
            () -> entregaService.asignarDriverARuta(999L, 100L));
    }

    @Test
    void testGetEntregasByIdPedido() {
        List<RegistroEntrega> entregas = Arrays.asList(
            createRegistroEntrega(1L, 1L),
            createRegistroEntrega(2L, 2L)
        );

        when(registroEntregaRepository.findByIdPedido(1L)).thenReturn(entregas);

        List<RegistroEntrega> resultado = entregaService.getEntregasByIdPedido(1L);

        assertNotNull(resultado);
        assertEquals(2, resultado.size());
        verify(registroEntregaRepository).findByIdPedido(1L);
    }

    @Test
    void testGetPedidos() {
        List<SesionReparto> sesiones = Arrays.asList(sesionReparto);
        when(sesionRepartoRepository.findAll()).thenReturn(sesiones);

        List<SesionReparto> resultado = entregaService.getPedidos();

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(sesionRepartoRepository).findAll();
    }

    @Test
    void testProgramarEntrega_Exitoso() {
        Map<String, Object> producto1 = new HashMap<>();
        producto1.put("id_producto", 1L);
        producto1.put("id_lote", 10L);
        producto1.put("cantidad_kg", 10);
        producto1.put("nombreProducto", "Pan Corriente");
        producto1.put("tipoProducto", "corriente");

        List<Map<String, Object>> productos = Arrays.asList(producto1);

        when(programacionEntregaRepository.save(any(ProgramacionEntrega.class)))
            .thenReturn(new ProgramacionEntrega());

        String resultado = entregaService.programarEntrega(1L, 1L, LocalDate.now(), productos);

        assertEquals("Entrega programada exitosamente", resultado);
        verify(programacionEntregaRepository).save(any(ProgramacionEntrega.class));
    }

    @Test
    void testGetProgramacionPorRutaYFecha() {
        LocalDate fecha = LocalDate.now();
        List<ProgramacionEntrega> programaciones = Arrays.asList(new ProgramacionEntrega());

        when(programacionEntregaRepository.findByIdRutaAndFechaProgramada(1L, fecha))
            .thenReturn(programaciones);

        List<ProgramacionEntrega> resultado = entregaService.getProgramacionPorRutaYFecha(1L, fecha);

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        verify(programacionEntregaRepository).findByIdRutaAndFechaProgramada(1L, fecha);
    }

    @Test
    void testObtenerEstadisticasDashboard() {
        LocalDate hoy = LocalDate.now();
        when(programacionEntregaRepository.countClientesByFechaProgramada(hoy)).thenReturn(10L);
        when(registroEntregaRepository.countByFecha(hoy)).thenReturn(7L);
        when(registroEntregaRepository.sumKilosByFecha(hoy)).thenReturn(150.0);
        when(registroEntregaRepository.countEntregasPorDia(any(), any()))
            .thenReturn(new ArrayList<>());

        Map<String, Object> resultado = entregaService.obtenerEstadisticasDashboard();

        assertNotNull(resultado);
        assertTrue(resultado.containsKey("entregasDelDia"));
        assertTrue(resultado.containsKey("productosVendidosHoy"));
        assertTrue(resultado.containsKey("entregasSemana"));
    }

    @Test
    void testGetRutasProgramadasPorFecha_FormatoDDMMYYYY() {
        // Arrange
        String fecha = "15-01-2026"; // Formato dd-MM-yyyy
        
        lenient().when(rutaClienteRepository.findAll()).thenReturn(new ArrayList<>());

        // Act & Assert - Solo verificamos que el método no lance excepción
        assertDoesNotThrow(() -> entregaService.getRutasProgramadasPorFecha(fecha));
    }

    @Test
    void testGetRutasProgramadasPorFecha_FormatoYYYYMMDD() {
        // Arrange
        String fecha = "2026-01-15"; // Formato yyyy-MM-dd
        
        lenient().when(rutaClienteRepository.findAll()).thenReturn(new ArrayList<>());

        // Act & Assert - Solo verificamos que el método no lance excepción
        assertDoesNotThrow(() -> entregaService.getRutasProgramadasPorFecha(fecha));
    }

    @Test
    void testGetRutasProgramadasPorFecha_FechaSinRutas() {
        // Arrange
        String fecha = "2026-12-31";
        lenient().when(rutaClienteRepository.findAll()).thenReturn(new ArrayList<>());

        // Act & Assert - Solo verificamos que el método no lance excepción
        assertDoesNotThrow(() -> entregaService.getRutasProgramadasPorFecha(fecha));
    }

    @Test
    void testActualizarProgramacionCliente_CrearNueva() {
        // Arrange
        Long idRuta = 1L;
        Long idCliente = 1L;
        String fecha = "15-01-2026";
        Double kgCorriente = 10.0;
        Double kgEspecial = 5.0;

        // No hay programaciones existentes para la fecha
        when(programacionEntregaRepository.findByIdRutaAndFechaProgramada(anyLong(), any()))
            .thenReturn(new ArrayList<>());
        
        // Hay clientes base en la ruta
        ProgramacionEntrega clienteBase = new ProgramacionEntrega();
        clienteBase.setId_cliente(idCliente);
        clienteBase.setId_ruta(idRuta);
        clienteBase.setOrden(1);
        clienteBase.setFecha_programada(null); // Cliente base sin fecha
        
        when(programacionEntregaRepository.findByIdRuta(idRuta))
            .thenReturn(Arrays.asList(clienteBase));
        when(programacionEntregaRepository.save(any(ProgramacionEntrega.class)))
            .thenReturn(new ProgramacionEntrega());

        // Act
        String resultado = entregaService.actualizarProgramacionCliente(idRuta, idCliente, fecha, kgCorriente, kgEspecial);

        // Assert
        assertTrue(resultado.contains("Programación creada exitosamente"));
        verify(programacionEntregaRepository).save(any(ProgramacionEntrega.class));
    }

    @Test
    void testActualizarProgramacionCliente_ActualizarExistente() {
        // Arrange
        Long idRuta = 1L;
        Long idCliente = 1L;
        String fecha = "2026-01-15";
        Double kgCorriente = 15.0;
        Double kgEspecial = 8.0;

        ProgramacionEntrega programacionExistente = new ProgramacionEntrega();
        programacionExistente.setId(1L);
        programacionExistente.setId_ruta(idRuta);
        programacionExistente.setId_cliente(idCliente);
        programacionExistente.setKg_corriente_programado(10.0);
        programacionExistente.setKg_especial_programado(5.0);

        // Ya existen programaciones para la fecha
        when(programacionEntregaRepository.findByIdRutaAndFechaProgramada(anyLong(), any()))
            .thenReturn(Arrays.asList(programacionExistente));
        when(programacionEntregaRepository.findByIdRutaAndIdClienteAndFechaProgramada(anyLong(), anyLong(), any()))
            .thenReturn(Arrays.asList(programacionExistente));
        when(programacionEntregaRepository.save(any(ProgramacionEntrega.class)))
            .thenReturn(programacionExistente);

        // Act
        String resultado = entregaService.actualizarProgramacionCliente(idRuta, idCliente, fecha, kgCorriente, kgEspecial);

        // Assert
        assertTrue(resultado.contains("Programación actualizada exitosamente"));
        verify(programacionEntregaRepository).save(argThat(prog -> 
            prog.getKg_corriente_programado().equals(15.0) && 
            prog.getKg_especial_programado().equals(8.0)
        ));
    }

    @Test
    void testActualizarProgramacionCliente_AmbosProductosNull() {
        // Arrange
        Long idRuta = 1L;
        Long idCliente = 1L;
        String fecha = "15-01-2026";
        Double kgCorriente = null;
        Double kgEspecial = null;

        when(programacionEntregaRepository.findByIdRutaAndFechaProgramada(anyLong(), any()))
            .thenReturn(new ArrayList<>());
        when(programacionEntregaRepository.findByIdRuta(idRuta))
            .thenReturn(new ArrayList<>());

        // Act - El método no lanza excepción, solo guarda con valores null
        String resultado = entregaService.actualizarProgramacionCliente(idRuta, idCliente, fecha, kgCorriente, kgEspecial);

        // Assert - Verificamos que retorna un resultado (no lanza excepción)
        assertNotNull(resultado);
    }

    @Test
    void testActualizarProgramacionCliente_FormatoFechaIncorrecto() {
        // Arrange
        Long idRuta = 1L;
        Long idCliente = 1L;
        String fecha = "fecha-invalida";
        Double kgCorriente = 10.0;
        Double kgEspecial = 5.0;

        // Act - El método captura la excepción y retorna mensaje de error
        String resultado = entregaService.actualizarProgramacionCliente(idRuta, idCliente, fecha, kgCorriente, kgEspecial);

        // Assert - Verificamos que retorna mensaje de error
        assertNotNull(resultado);
        assertTrue(resultado.contains("Error"));
    }

    @Test
    void testCrearRuta_Exitoso() {
        // Arrange
        Map<String, Object> datosRuta = new HashMap<>();
        datosRuta.put("nombre", "Ruta Norte");
        datosRuta.put("origen_coordenada", "-34.6037,-58.3816");

        Ruta rutaGuardada = new Ruta();
        rutaGuardada.setId(1L);
        rutaGuardada.setNombre("Ruta Norte");
        rutaGuardada.setLatitud(-34.6037);
        rutaGuardada.setLongitud(-58.3816);

        when(rutaRepository.findAll()).thenReturn(new ArrayList<>());
        when(rutaRepository.save(any(Ruta.class))).thenReturn(rutaGuardada);

        // Act
        String resultado = entregaService.crearRuta(datosRuta);

        // Assert
        assertNotNull(resultado);
        assertTrue(resultado.contains("Ruta"));
        assertTrue(resultado.contains("creada exitosamente"));
        verify(rutaRepository).save(argThat(ruta -> 
            ruta.getNombre().equals("Ruta Norte") && 
            ruta.getLatitud() != null &&
            ruta.getLongitud() != null
        ));
    }

    @Test
    void testCrearRuta_DatosIncompletos() {
        // Arrange
        Map<String, Object> datosRuta = new HashMap<>();
        // Falta nombre (obligatorio)

        // Act & Assert
        assertThrows(Exception.class, 
            () -> entregaService.crearRuta(datosRuta));
        
        verify(rutaRepository, never()).save(any());
    }

    @Test
    void testCrearRuta_CoordenadasInvalidas() {
        // Arrange
        Map<String, Object> datosRuta = new HashMap<>();
        datosRuta.put("nombre", "Ruta Test");
        datosRuta.put("origen_coordenada", "invalido,invalido");

        Ruta rutaGuardada = new Ruta();
        rutaGuardada.setId(1L);
        rutaGuardada.setNombre("Ruta Test");
        
        when(rutaRepository.findAll()).thenReturn(new ArrayList<>());
        when(rutaRepository.save(any(Ruta.class))).thenReturn(rutaGuardada);

        // Act - Debería guardar sin coordenadas si no se pueden parsear
        String resultado = entregaService.crearRuta(datosRuta);

        // Assert
        assertNotNull(resultado);
        verify(rutaRepository).save(any(Ruta.class));
    }
}
