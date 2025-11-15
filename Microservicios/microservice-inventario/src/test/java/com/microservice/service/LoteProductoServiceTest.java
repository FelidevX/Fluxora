package com.microservice.service;

import com.microservice.dto.LoteProductoDTO;
import com.microservice.dto.StockDisponibleDTO;
import com.microservice.entity.*;
import com.microservice.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoteProductoServiceTest {

    @Mock
    private LoteProductoRepository loteProductoRepository;

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private LoteMateriaPrimaRepository loteMateriaPrimaRepository;

    @Mock
    private MateriaPrimaRepository materiaPrimaRepository;

    @InjectMocks
    private LoteProductoService loteProductoService;

    private Producto producto;
    private RecetaMaestra recetaMaestra;
    private RecetaIngrediente ingrediente;
    private LoteProductoDTO loteProductoDTO;
    private LoteMateriaPrima loteMateriaPrima;

    @BeforeEach
    void setUp() {
        // Setup RecetaIngrediente
        ingrediente = RecetaIngrediente.builder()
                .id(1L)
                .materiaPrimaId(10L)
                .materiaPrimaNombre("Harina")
                .cantidadNecesaria(500.0) // 500gr por cada 10 unidades
                .unidad("gr")
                .build();

        // Setup RecetaMaestra
        recetaMaestra = RecetaMaestra.builder()
                .id(1L)
                .nombre("Receta Pan")
                .cantidadBase(10.0) // 10 unidades base
                .ingredientes(Collections.singletonList(ingrediente))
                .build();

        // Setup Producto
        producto = Producto.builder()
                .id(1L)
                .nombre("Pan Integral")
                .recetaMaestra(recetaMaestra)
                .build();

        // Setup LoteMateriaPrima
        loteMateriaPrima = LoteMateriaPrima.builder()
                .id(1L)
                .materiaPrimaId(10L)
                .cantidad(1000.0)
                .stockActual(1000.0)
                .costoUnitario(2.5)
                .fechaCompra(LocalDate.now())
                .fechaVencimiento(LocalDate.now().plusMonths(1))
                .build();

        // Setup LoteProductoDTO
        loteProductoDTO = LoteProductoDTO.builder()
                .cantidadProducida(10)
                .costoProduccionTotal(100.0)
                .costoUnitario(10.0)
                .fechaProduccion(LocalDate.now())
                .fechaVencimiento(LocalDate.now().plusDays(7))
                .estado("disponible")
                .build();
    }

    @Test
    void save_DeberiaCrearLoteSinReceta() {
        // Arrange
        Producto productoSinReceta = Producto.builder()
                .id(2L)
                .nombre("Producto Sin Receta")
                .recetaMaestra(null)
                .build();

        LoteProducto loteGuardado = LoteProducto.builder()
                .id(1L)
                .productoId(2L)
                .cantidadProducida(10)
                .stockActual(10)
                .costoProduccionTotal(100.0)
                .costoUnitario(10.0)
                .fechaProduccion(LocalDate.now())
                .estado("disponible")
                .build();

        when(productoRepository.findById(2L)).thenReturn(Optional.of(productoSinReceta));
        when(loteProductoRepository.save(any(LoteProducto.class))).thenReturn(loteGuardado);

        // Act
        LoteProductoDTO result = loteProductoService.save(2L, loteProductoDTO);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(2L, result.getProductoId());
        assertEquals(10, result.getCantidadProducida());
        verify(productoRepository, times(1)).findById(2L);
        verify(loteProductoRepository, times(1)).save(any(LoteProducto.class));
        verify(loteMateriaPrimaRepository, never()).findLotesByMateriaPrimaIdOrderByFechaVencimientoAsc(any());
    }

    @Test
    void save_DeberiaLanzarExcepcionCuandoProductoNoExiste() {
        // Arrange
        when(productoRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            loteProductoService.save(999L, loteProductoDTO);
        });
        assertEquals("Producto no encontrado con ID: 999", exception.getMessage());
        verify(productoRepository, times(1)).findById(999L);
        verify(loteProductoRepository, never()).save(any(LoteProducto.class));
    }

    @Test
    void save_DeberiaDescontarStockConRecetaYSuficienteInventario() {
        // Arrange
        when(productoRepository.findById(1L)).thenReturn(Optional.of(producto));
        when(loteMateriaPrimaRepository.findLotesByMateriaPrimaIdOrderByFechaVencimientoAsc(10L))
                .thenReturn(Collections.singletonList(loteMateriaPrima));

        LoteProducto loteGuardado = LoteProducto.builder()
                .id(1L)
                .productoId(1L)
                .cantidadProducida(10)
                .stockActual(10)
                .costoProduccionTotal(100.0)
                .costoUnitario(10.0)
                .fechaProduccion(LocalDate.now())
                .estado("disponible")
                .build();

        when(loteProductoRepository.save(any(LoteProducto.class))).thenReturn(loteGuardado);

        // Act
        LoteProductoDTO result = loteProductoService.save(1L, loteProductoDTO);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(500.0, loteMateriaPrima.getStockActual()); // 1000 - 500 = 500
        verify(loteMateriaPrimaRepository, times(1))
                .findLotesByMateriaPrimaIdOrderByFechaVencimientoAsc(10L);
        verify(loteMateriaPrimaRepository, times(1)).save(loteMateriaPrima);
        verify(loteProductoRepository, times(1)).save(any(LoteProducto.class));
    }

    @Test
    void save_DeberiaLanzarExcepcionCuandoStockInsuficiente() {
        // Arrange
        loteMateriaPrima.setStockActual(100.0); // Insuficiente para producir 10 unidades (necesita 500gr)
        
        when(productoRepository.findById(1L)).thenReturn(Optional.of(producto));
        when(loteMateriaPrimaRepository.findLotesByMateriaPrimaIdOrderByFechaVencimientoAsc(10L))
                .thenReturn(Collections.singletonList(loteMateriaPrima));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            loteProductoService.save(1L, loteProductoDTO);
        });
        assertTrue(exception.getMessage().contains("Stock insuficiente"));
        verify(loteProductoRepository, never()).save(any(LoteProducto.class));
    }

    @Test
    void save_DeberiaAplicarFEFOConMultiplesLotes() {
        // Arrange
        LoteMateriaPrima loteViejoProximoAVencer = LoteMateriaPrima.builder()
                .id(1L)
                .materiaPrimaId(10L)
                .stockActual(200.0)
                .fechaVencimiento(LocalDate.now().plusDays(5)) // Vence pronto
                .build();

        LoteMateriaPrima loteNuevo = LoteMateriaPrima.builder()
                .id(2L)
                .materiaPrimaId(10L)
                .stockActual(800.0)
                .fechaVencimiento(LocalDate.now().plusMonths(2)) // Vence después
                .build();

        when(productoRepository.findById(1L)).thenReturn(Optional.of(producto));
        when(loteMateriaPrimaRepository.findLotesByMateriaPrimaIdOrderByFechaVencimientoAsc(10L))
                .thenReturn(Arrays.asList(loteViejoProximoAVencer, loteNuevo));

        LoteProducto loteGuardado = LoteProducto.builder()
                .id(1L)
                .productoId(1L)
                .cantidadProducida(10)
                .stockActual(10)
                .costoProduccionTotal(100.0)
                .costoUnitario(10.0)
                .fechaProduccion(LocalDate.now())
                .estado("disponible")
                .build();

        when(loteProductoRepository.save(any(LoteProducto.class))).thenReturn(loteGuardado);

        // Act
        LoteProductoDTO result = loteProductoService.save(1L, loteProductoDTO);

        // Assert
        assertNotNull(result);
        // Lote viejo debería quedar en 0 (200gr consumidos)
        assertEquals(0.0, loteViejoProximoAVencer.getStockActual());
        // Lote nuevo debería descontar el resto (500-200 = 300gr)
        assertEquals(500.0, loteNuevo.getStockActual()); // 800 - 300 = 500
        verify(loteMateriaPrimaRepository, times(2)).save(any(LoteMateriaPrima.class));
    }

    @Test
    void save_DeberiaCalcularCostoUnitarioCuandoNoViene() {
        // Arrange
        loteProductoDTO.setCostoUnitario(null);
        loteProductoDTO.setCostoProduccionTotal(100.0);
        loteProductoDTO.setCantidadProducida(10);

        Producto productoSinReceta = Producto.builder()
                .id(2L)
                .nombre("Producto Sin Receta")
                .recetaMaestra(null)
                .build();

        LoteProducto loteGuardado = LoteProducto.builder()
                .id(1L)
                .productoId(2L)
                .cantidadProducida(10)
                .stockActual(10)
                .costoProduccionTotal(100.0)
                .costoUnitario(10.0) // 100/10 = 10
                .fechaProduccion(LocalDate.now())
                .estado("disponible")
                .build();

        when(productoRepository.findById(2L)).thenReturn(Optional.of(productoSinReceta));
        when(loteProductoRepository.save(any(LoteProducto.class))).thenReturn(loteGuardado);

        // Act
        LoteProductoDTO result = loteProductoService.save(2L, loteProductoDTO);

        // Assert
        assertNotNull(result);
        assertEquals(10.0, result.getCostoUnitario());
    }

    @Test
    void update_DeberiaActualizarLoteExistente() {
        // Arrange
        LoteProducto loteExistente = LoteProducto.builder()
                .id(1L)
                .productoId(1L)
                .cantidadProducida(10)
                .stockActual(10)
                .costoProduccionTotal(100.0)
                .costoUnitario(10.0)
                .fechaProduccion(LocalDate.now())
                .estado("disponible")
                .build();

        LoteProductoDTO updateDTO = LoteProductoDTO.builder()
                .stockActual(8)
                .estado("parcialmente_agotado")
                .build();

        when(loteProductoRepository.findById(1L)).thenReturn(Optional.of(loteExistente));
        when(loteProductoRepository.save(any(LoteProducto.class))).thenReturn(loteExistente);

        // Act
        LoteProductoDTO result = loteProductoService.update(1L, updateDTO);

        // Assert
        assertNotNull(result);
        assertEquals(8, result.getStockActual());
        assertEquals("parcialmente_agotado", result.getEstado());
        verify(loteProductoRepository, times(1)).findById(1L);
        verify(loteProductoRepository, times(1)).save(loteExistente);
    }

    @Test
    void update_DeberiaLanzarExcepcionCuandoNoExiste() {
        // Arrange
        when(loteProductoRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            loteProductoService.update(999L, loteProductoDTO);
        });
        assertEquals("Lote de producto no encontrado con ID: 999", exception.getMessage());
        verify(loteProductoRepository, never()).save(any(LoteProducto.class));
    }

    @Test
    void delete_DeberiaEliminarLote() {
        // Arrange
        doNothing().when(loteProductoRepository).deleteById(1L);

        // Act
        loteProductoService.delete(1L);

        // Assert
        verify(loteProductoRepository, times(1)).deleteById(1L);
    }

    @Test
    void listByProducto_DeberiaRetornarLotesOrdenadosPorFechaProduccion() {
        // Arrange
        LoteProducto lote1 = LoteProducto.builder()
                .id(1L)
                .productoId(1L)
                .cantidadProducida(10)
                .stockActual(10)
                .fechaProduccion(LocalDate.now())
                .build();

        LoteProducto lote2 = LoteProducto.builder()
                .id(2L)
                .productoId(1L)
                .cantidadProducida(20)
                .stockActual(15)
                .fechaProduccion(LocalDate.now().minusDays(1))
                .build();

        when(loteProductoRepository.findLotesByProductoIdOrderByFechaProduccionDesc(1L))
                .thenReturn(Arrays.asList(lote1, lote2));

        // Act
        List<LoteProductoDTO> result = loteProductoService.listByProducto(1L);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(1L, result.get(0).getId());
        assertEquals(2L, result.get(1).getId());
    }

    @Test
    void getStockTotalByProducto_DeberiaRetornarStockTotal() {
        // Arrange
        when(loteProductoRepository.sumStockActualByProductoId(1L)).thenReturn(100);

        // Act
        Integer result = loteProductoService.getStockTotalByProducto(1L);

        // Assert
        assertEquals(100, result);
        verify(loteProductoRepository, times(1)).sumStockActualByProductoId(1L);
    }

    @Test
    void verificarStockDisponible_DeberiaCalcularStockPorIngrediente() {
        // Arrange
        MateriaPrima materiaPrima = MateriaPrima.builder()
                .id(10L)
                .nombre("Harina de Trigo")
                .unidad("gr")
                .build();

        when(productoRepository.findById(1L)).thenReturn(Optional.of(producto));
        when(materiaPrimaRepository.findById(10L)).thenReturn(Optional.of(materiaPrima));
        when(loteMateriaPrimaRepository.sumStockActualByMateriaPrimaId(10L)).thenReturn(1000.0);

        // Act - multiplicador 2 = producir 20 unidades (necesita 1000gr)
        List<StockDisponibleDTO> result = loteProductoService.verificarStockDisponible(1L, 2.0);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        StockDisponibleDTO stock = result.get(0);
        assertEquals(10L, stock.getMateriaPrimaId());
        assertEquals("Harina de Trigo", stock.getMateriaPrimaNombre());
        assertEquals(1000.0, stock.getCantidadNecesaria()); // 500gr * 2
        assertEquals(1000.0, stock.getStockDisponible());
        assertTrue(stock.getSuficiente());
    }

    @Test
    void verificarStockDisponible_DeberiaIndicarInsuficiente() {
        // Arrange
        MateriaPrima materiaPrima = MateriaPrima.builder()
                .id(10L)
                .nombre("Harina de Trigo")
                .unidad("gr")
                .build();

        when(productoRepository.findById(1L)).thenReturn(Optional.of(producto));
        when(materiaPrimaRepository.findById(10L)).thenReturn(Optional.of(materiaPrima));
        when(loteMateriaPrimaRepository.sumStockActualByMateriaPrimaId(10L)).thenReturn(200.0);

        // Act - multiplicador 2 = necesita 1000gr pero solo hay 200gr
        List<StockDisponibleDTO> result = loteProductoService.verificarStockDisponible(1L, 2.0);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        StockDisponibleDTO stock = result.get(0);
        assertEquals(1000.0, stock.getCantidadNecesaria());
        assertEquals(200.0, stock.getStockDisponible());
        assertFalse(stock.getSuficiente());
    }

    @Test
    void verificarStockDisponible_DeberiaLanzarExcepcionSinReceta() {
        // Arrange
        Producto productoSinReceta = Producto.builder()
                .id(2L)
                .nombre("Producto Sin Receta")
                .recetaMaestra(null)
                .build();

        when(productoRepository.findById(2L)).thenReturn(Optional.of(productoSinReceta));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            loteProductoService.verificarStockDisponible(2L, 1.0);
        });
        assertEquals("El producto no tiene una receta asociada", exception.getMessage());
    }

    @Test
    void descontarStock_DeberiaDescontarAplicandoFEFO() {
        // Arrange
        LoteProducto loteViejo = LoteProducto.builder()
                .id(1L)
                .productoId(1L)
                .stockActual(5)
                .fechaVencimiento(LocalDate.now().plusDays(3))
                .build();

        LoteProducto loteNuevo = LoteProducto.builder()
                .id(2L)
                .productoId(1L)
                .stockActual(10)
                .fechaVencimiento(LocalDate.now().plusMonths(1))
                .build();

        when(loteProductoRepository.findLotesDisponiblesByProductoIdOrderByFechaVencimientoAsc(1L))
                .thenReturn(Arrays.asList(loteViejo, loteNuevo));

        Map<String, Object> datos = new HashMap<>();
        datos.put("descontarCantidad", 8);

        // Act
        loteProductoService.descontarStock(1L, datos);

        // Assert
        assertEquals(0, loteViejo.getStockActual()); // Descontó 5
        assertEquals(7, loteNuevo.getStockActual()); // Descontó 3 (total 5+3=8)
        verify(loteProductoRepository, times(2)).save(any(LoteProducto.class));
    }

    @Test
    void descontarStock_DeberiaLanzarExcepcionCuandoStockInsuficiente() {
        // Arrange
        LoteProducto lote = LoteProducto.builder()
                .id(1L)
                .productoId(1L)
                .stockActual(5)
                .build();

        when(loteProductoRepository.findLotesDisponiblesByProductoIdOrderByFechaVencimientoAsc(1L))
                .thenReturn(Collections.singletonList(lote));

        Map<String, Object> datos = new HashMap<>();
        datos.put("descontarCantidad", 10); // Necesita 10 pero solo hay 5

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            loteProductoService.descontarStock(1L, datos);
        });
        assertEquals("No hay suficiente stock para descontar la cantidad solicitada.", exception.getMessage());
    }

    @Test
    void getLoteById_DeberiaRetornarLoteCuandoExiste() {
        // Arrange
        LoteProducto lote = LoteProducto.builder()
                .id(1L)
                .productoId(1L)
                .cantidadProducida(10)
                .stockActual(10)
                .build();

        when(loteProductoRepository.findById(1L)).thenReturn(Optional.of(lote));

        // Act
        LoteProducto result = loteProductoService.getLoteById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        verify(loteProductoRepository, times(1)).findById(1L);
    }

    @Test
    void getLoteById_DeberiaLanzarExcepcionCuandoNoExiste() {
        // Arrange
        when(loteProductoRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            loteProductoService.getLoteById(999L);
        });
        assertEquals("Lote de producto no encontrado con ID: 999", exception.getMessage());
    }
}
