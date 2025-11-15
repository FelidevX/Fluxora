package com.microservice.service;

import com.microservice.dto.ProductoDTO;
import com.microservice.entity.Producto;
import com.microservice.entity.RecetaMaestra;
import com.microservice.repository.ProductoRepository;
import com.microservice.repository.LoteProductoRepository;
import com.microservice.repository.RecetaMaestraRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductoServiceTest {

    @Mock
    private ProductoRepository productoRepo;

    @Mock
    private LoteProductoRepository loteProductoRepository;

    @Mock
    private RecetaMaestraRepository recetaMaestraRepository;

    @InjectMocks
    private ProductoService productoService;

    private Producto producto;
    private ProductoDTO productoDTO;
    private RecetaMaestra recetaMaestra;

    @BeforeEach
    void setUp() {
        recetaMaestra = RecetaMaestra.builder()
                .id(1L)
                .nombre("Receta Pan")
                .cantidadBase(10.0)
                .build();

        producto = Producto.builder()
                .id(1L)
                .nombre("Pan Integral")
                .estado("activo")
                .precioVenta(5.50)
                .tipoProducto(Producto.TipoProducto.CORRIENTE)
                .categoria("panaderia")
                .recetaMaestra(recetaMaestra)
                .build();

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
    void findAll_DeberiaRetornarListaDeProductos() {
        // Arrange
        Producto producto2 = Producto.builder()
                .id(2L)
                .nombre("Torta Chocolate")
                .estado("activo")
                .precioVenta(25.00)
                .tipoProducto(Producto.TipoProducto.ESPECIAL)
                .categoria("pasteleria")
                .build();

        when(productoRepo.findAll()).thenReturn(Arrays.asList(producto, producto2));
        when(loteProductoRepository.sumStockActualByProductoId(1L)).thenReturn(100);
        when(loteProductoRepository.sumStockActualByProductoId(2L)).thenReturn(50);

        // Act
        List<ProductoDTO> result = productoService.findAll();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Pan Integral", result.get(0).getNombre());
        assertEquals(100, result.get(0).getStockTotal());
        assertEquals("Torta Chocolate", result.get(1).getNombre());
        assertEquals(50, result.get(1).getStockTotal());
        verify(productoRepo, times(1)).findAll();
    }

    @Test
    void findAll_DeberiaRetornarListaVaciaCuandoNoHayProductos() {
        // Arrange
        when(productoRepo.findAll()).thenReturn(Arrays.asList());

        // Act
        List<ProductoDTO> result = productoService.findAll();

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(productoRepo, times(1)).findAll();
    }

    @Test
    void findById_DeberiaRetornarProductoCuandoExiste() {
        // Arrange
        when(productoRepo.findById(1L)).thenReturn(Optional.of(producto));
        when(loteProductoRepository.sumStockActualByProductoId(1L)).thenReturn(100);

        // Act
        ProductoDTO result = productoService.findById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Pan Integral", result.getNombre());
        assertEquals("CORRIENTE", result.getTipoProducto());
        assertEquals(100, result.getStockTotal());
        verify(productoRepo, times(1)).findById(1L);
    }

    @Test
    void findById_DeberiaLanzarExcepcionCuandoNoExiste() {
        // Arrange
        when(productoRepo.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            productoService.findById(999L);
        });
        assertEquals("Producto no encontrado con ID: 999", exception.getMessage());
        verify(productoRepo, times(1)).findById(999L);
    }

    @Test
    void save_DeberiaCrearProductoConRecetaMaestra() {
        // Arrange
        ProductoDTO nuevoProductoDTO = ProductoDTO.builder()
                .nombre("Pan Francés")
                .estado("activo")
                .precioVenta(3.50)
                .tipoProducto("CORRIENTE")
                .categoria("panaderia")
                .recetaMaestraId(1L)
                .build();

        Producto productoGuardado = Producto.builder()
                .id(3L)
                .nombre("Pan Francés")
                .estado("activo")
                .precioVenta(3.50)
                .tipoProducto(Producto.TipoProducto.CORRIENTE)
                .categoria("panaderia")
                .recetaMaestra(recetaMaestra)
                .build();

        when(recetaMaestraRepository.findById(1L)).thenReturn(Optional.of(recetaMaestra));
        when(productoRepo.save(any(Producto.class))).thenReturn(productoGuardado);
        when(loteProductoRepository.sumStockActualByProductoId(3L)).thenReturn(0);

        // Act
        ProductoDTO result = productoService.save(nuevoProductoDTO);

        // Assert
        assertNotNull(result);
        assertEquals(3L, result.getId());
        assertEquals("Pan Francés", result.getNombre());
        assertEquals(1L, result.getRecetaMaestraId());
        verify(recetaMaestraRepository, times(1)).findById(1L);
        verify(productoRepo, times(1)).save(any(Producto.class));
    }

    @Test
    void save_DeberiaCrearProductoSinRecetaMaestra() {
        // Arrange
        ProductoDTO nuevoProductoDTO = ProductoDTO.builder()
                .nombre("Producto Sin Receta")
                .estado("activo")
                .precioVenta(10.00)
                .tipoProducto("NO_APLICA")
                .categoria("otros")
                .build();

        Producto productoGuardado = Producto.builder()
                .id(4L)
                .nombre("Producto Sin Receta")
                .estado("activo")
                .precioVenta(10.00)
                .tipoProducto(Producto.TipoProducto.NO_APLICA)
                .categoria("otros")
                .build();

        when(productoRepo.save(any(Producto.class))).thenReturn(productoGuardado);
        when(loteProductoRepository.sumStockActualByProductoId(4L)).thenReturn(0);

        // Act
        ProductoDTO result = productoService.save(nuevoProductoDTO);

        // Assert
        assertNotNull(result);
        assertEquals(4L, result.getId());
        assertEquals("Producto Sin Receta", result.getNombre());
        assertNull(result.getRecetaMaestraId());
        verify(recetaMaestraRepository, never()).findById(any());
        verify(productoRepo, times(1)).save(any(Producto.class));
    }

    @Test
    void save_DeberiaManejarTipoProductoInvalidoComoNoAplica() {
        // Arrange
        ProductoDTO nuevoProductoDTO = ProductoDTO.builder()
                .nombre("Producto Invalido")
                .estado("activo")
                .precioVenta(10.00)
                .tipoProducto("TIPO_INVALIDO")
                .categoria("otros")
                .build();

        Producto productoGuardado = Producto.builder()
                .id(5L)
                .nombre("Producto Invalido")
                .estado("activo")
                .precioVenta(10.00)
                .tipoProducto(Producto.TipoProducto.NO_APLICA)
                .categoria("otros")
                .build();

        when(productoRepo.save(any(Producto.class))).thenReturn(productoGuardado);
        when(loteProductoRepository.sumStockActualByProductoId(5L)).thenReturn(0);

        // Act
        ProductoDTO result = productoService.save(nuevoProductoDTO);

        // Assert
        assertNotNull(result);
        assertEquals("NO_APLICA", result.getTipoProducto());
        verify(productoRepo, times(1)).save(any(Producto.class));
    }

    @Test
    void update_DeberiaActualizarProductoExistente() {
        // Arrange
        ProductoDTO updateDTO = ProductoDTO.builder()
                .nombre("Pan Integral Premium")
                .estado("activo")
                .precioVenta(7.50)
                .tipoProducto("ESPECIAL")
                .categoria("panaderia")
                .build();

        when(productoRepo.findById(1L)).thenReturn(Optional.of(producto));
        when(productoRepo.save(any(Producto.class))).thenReturn(producto);
        when(loteProductoRepository.sumStockActualByProductoId(1L)).thenReturn(100);

        // Act
        ProductoDTO result = productoService.update(1L, updateDTO);

        // Assert
        assertNotNull(result);
        assertEquals("Pan Integral Premium", result.getNombre());
        assertEquals(7.50, result.getPrecioVenta());
        assertEquals("ESPECIAL", result.getTipoProducto());
        verify(productoRepo, times(1)).findById(1L);
        verify(productoRepo, times(1)).save(producto);
    }

    @Test
    void update_DeberiaLanzarExcepcionCuandoNoExiste() {
        // Arrange
        ProductoDTO updateDTO = ProductoDTO.builder()
                .nombre("Producto Actualizado")
                .build();

        when(productoRepo.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            productoService.update(999L, updateDTO);
        });
        assertEquals("Producto no encontrado con ID: 999", exception.getMessage());
        verify(productoRepo, times(1)).findById(999L);
        verify(productoRepo, never()).save(any(Producto.class));
    }

    @Test
    void update_DeberiaActualizarSoloCamposNoNulos() {
        // Arrange
        ProductoDTO updateDTO = ProductoDTO.builder()
                .nombre("Nuevo Nombre")
                .build();

        when(productoRepo.findById(1L)).thenReturn(Optional.of(producto));
        when(productoRepo.save(any(Producto.class))).thenReturn(producto);
        when(loteProductoRepository.sumStockActualByProductoId(1L)).thenReturn(100);

        // Act
        ProductoDTO result = productoService.update(1L, updateDTO);

        // Assert
        assertNotNull(result);
        assertEquals("Nuevo Nombre", result.getNombre());
        assertEquals(5.50, result.getPrecioVenta()); // No debe cambiar
        verify(productoRepo, times(1)).findById(1L);
        verify(productoRepo, times(1)).save(producto);
    }

    @Test
    void delete_DeberiaEliminarProducto() {
        // Arrange
        doNothing().when(productoRepo).deleteById(1L);

        // Act
        productoService.delete(1L);

        // Assert
        verify(productoRepo, times(1)).deleteById(1L);
    }

    @Test
    void toDTO_DeberiaConvertirCorrectamenteConStockNulo() {
        // Arrange
        when(productoRepo.findById(1L)).thenReturn(Optional.of(producto));
        when(loteProductoRepository.sumStockActualByProductoId(1L)).thenReturn(null);

        // Act
        ProductoDTO result = productoService.findById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(0, result.getStockTotal()); // Debe convertir null a 0
    }

    @Test
    void toDTO_DeberiaConvertirProductoSinRecetaMaestra() {
        // Arrange
        Producto productoSinReceta = Producto.builder()
                .id(10L)
                .nombre("Producto Sin Receta")
                .estado("activo")
                .precioVenta(15.00)
                .tipoProducto(null)
                .categoria("otros")
                .recetaMaestra(null)
                .build();

        when(productoRepo.findById(10L)).thenReturn(Optional.of(productoSinReceta));
        when(loteProductoRepository.sumStockActualByProductoId(10L)).thenReturn(20);

        // Act
        ProductoDTO result = productoService.findById(10L);

        // Assert
        assertNotNull(result);
        assertEquals(10L, result.getId());
        assertNull(result.getRecetaMaestraId());
        assertNull(result.getTipoProducto());
        assertEquals(20, result.getStockTotal());
    }
}
