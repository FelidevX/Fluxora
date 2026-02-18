package com.microservice.entrega.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.microservice.entrega.client.ClienteServiceClient;
import com.microservice.entrega.client.InventarioServiceClient;
import com.microservice.entrega.dto.ClienteDTO;
import com.microservice.entrega.dto.ProductoEntregadoDTO;
import com.microservice.entrega.dto.RegistroEntregaDTO;
import com.microservice.entrega.entity.ProgramacionEntrega;
import com.microservice.entrega.entity.RegistroEntrega;
import com.microservice.entrega.entity.SesionReparto;
import com.microservice.entrega.entity.TipoMovimiento;
import com.microservice.entrega.repository.ProgramacionEntregaRepository;
import com.microservice.entrega.repository.RegistroEntregaRepository;
import com.microservice.entrega.repository.RutaClienteRepository;
import com.microservice.entrega.repository.SesionRepartoRepository;
import com.microservice.entrega.util.EmailTemplateGenerator;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class RegistroEntregaService {

    private final RegistroEntregaRepository registroEntregaRepository;
    private final ProgramacionEntregaRepository programacionEntregaRepository;
    private final RutaClienteRepository rutaClienteRepository;
    private final SesionRepartoRepository sesionRepartoRepository;
    private final ClienteServiceClient clienteServiceClient;
    private final InventarioServiceClient inventarioServiceClient;
    private final EmailService emailService;
    private final EmailTemplateGenerator emailTemplateGenerator;

    /**
     * Registra una entrega de tipo VENTA, MERMA o AJUSTE.
     * Orquesta el proceso completo: validación de tipo, obtención de datos del cliente,
     * creación del registro, descuento de inventario y envío de email de confirmación.
     * 
     * @param dto Datos de la entrega a registrar
     * @throws RuntimeException si ocurre un error en el proceso de registro
     */
    public void registrarEntrega(RegistroEntregaDTO dto) {
        try {
            TipoMovimiento tipo = obtenerTipoMovimiento(dto);
            DatosClientePrecios datosCliente = obtenerDatosClienteYPrecios(dto, tipo);
            if (tipo == TipoMovimiento.VENTA && dto.getProductos() != null) {
                verificarStockSuficiente(dto);
            }
            RegistroEntrega registroEntrega = crearYGuardarRegistroEntrega(dto, tipo, datosCliente);
            
            log.info("✅ Entrega registrada - Tipo: {} Total: ${} (Corriente: ${}, Especial: ${})", 
                tipo, registroEntrega.getMonto_total(), registroEntrega.getMonto_corriente(), 
                registroEntrega.getMonto_especial());

            if (tipo == TipoMovimiento.VENTA) {
                procesarVenta(dto, datosCliente);
            }
        } catch (RuntimeException e) {
            // Re-lanzar excepciones de negocio sin envolver (stock insuficiente, etc.)
            log.error("Error en registrarEntrega: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            // Solo atrapar errores técnicos inesperados
            log.error("Error técnico en registrarEntrega: {}", e.getMessage(), e);
            throw new RuntimeException("Error al registrar entrega: " + e.getMessage());
        }
    }

    /**
     * Obtiene el tipo de movimiento del DTO o establece VENTA como valor por defecto.
     */
    private TipoMovimiento obtenerTipoMovimiento(RegistroEntregaDTO dto) {
        return dto.getTipo() != null ? dto.getTipo() : TipoMovimiento.VENTA;
    }

    /**
     * Obtiene los datos del cliente y precios según el tipo de movimiento.
     * Para VENTA: consulta datos del cliente y precios.
     * Para MERMA/AJUSTE: establece precios en 0.
     */
    private DatosClientePrecios obtenerDatosClienteYPrecios(RegistroEntregaDTO dto, TipoMovimiento tipo) {
        if (tipo == TipoMovimiento.VENTA && dto.getId_cliente() != null) {
            ClienteDTO cliente = clienteServiceClient.getClienteById(dto.getId_cliente());
            
            // Usar precios del DTO si están disponibles, sino usar precios del cliente
            Double precioCorriente = dto.getPrecio_corriente() != null 
                ? dto.getPrecio_corriente() 
                : cliente.getPrecioCorriente();
            Double precioEspecial = dto.getPrecio_especial() != null 
                ? dto.getPrecio_especial() 
                : cliente.getPrecioEspecial();
            
            return new DatosClientePrecios(
                cliente.getEmail(),
                cliente.getNombre(),
                precioCorriente,
                precioEspecial
            );
        }
        
        // Para MERMA y AJUSTE, precios en 0
        return new DatosClientePrecios(null, null, 0.0, 0.0);
    }

    /**
     * Crea el registro de entrega con los montos calculados y lo persiste.
     */
    private RegistroEntrega crearYGuardarRegistroEntrega(
            RegistroEntregaDTO dto, 
            TipoMovimiento tipo, 
            DatosClientePrecios datosCliente) {
        
        Double montoCorriente = calcularMonto(dto.getCorriente_entregado(), datosCliente.precioCorriente);
        Double montoEspecial = calcularMonto(dto.getEspecial_entregado(), datosCliente.precioEspecial);
        Double montoTotal = montoCorriente + montoEspecial;

        RegistroEntrega registroEntrega = new RegistroEntrega();
        registroEntrega.setTipo(tipo);
        registroEntrega.setId_pedido(dto.getId_pedido());
        registroEntrega.setId_cliente(dto.getId_cliente());
        registroEntrega.setHora_entregada(dto.getHora_entregada());
        registroEntrega.setComentario(dto.getComentario());
        registroEntrega.setCorriente_entregado(dto.getCorriente_entregado());
        registroEntrega.setEspecial_entregado(dto.getEspecial_entregado());
        registroEntrega.setMonto_corriente(montoCorriente);
        registroEntrega.setMonto_especial(montoEspecial);
        registroEntrega.setMonto_total(montoTotal);

        return registroEntregaRepository.save(registroEntrega);
    }

    /**
     * Calcula el monto total para un tipo de producto.
     * @param cantidad Cantidad entregada (puede ser null)
     * @param precio Precio unitario
     * @return Monto total (0.0 si cantidad es null)
     */
    private Double calcularMonto(Double cantidad, Double precio) {
        return (cantidad != null ? cantidad : 0.0) * precio;
    }

    /**
     * Procesa una venta: actualiza programación, descuenta inventario y envía email.
     */
    private void procesarVenta(RegistroEntregaDTO dto, DatosClientePrecios datosCliente) {
        actualizarProgramacionSiExiste(dto);
        
        if (dto.getProductos() != null) {
            descontarInventarioDeProductos(dto);
            enviarEmailConfirmacionSiPosible(dto, datosCliente);
        }
    }

    /**
     * Actualiza el estado de la programación a ENTREGADO si existe una ruta asociada.
     */
    private void actualizarProgramacionSiExiste(RegistroEntregaDTO dto) {
        if (dto.getId_ruta() != null && dto.getFecha_programada() != null) {
            List<ProgramacionEntrega> programaciones = programacionEntregaRepository
                .findByIdRutaAndIdClienteAndFechaProgramada(
                    dto.getId_ruta(),
                    dto.getId_cliente(),
                    dto.getFecha_programada());

            for (ProgramacionEntrega prog : programaciones) {
                prog.setEstado("ENTREGADO");
                programacionEntregaRepository.save(prog);
            }
        }
    }

    /**
     * Descuenta el inventario para todos los productos con cantidad mayor a 0.
     */
    private void descontarInventarioDeProductos(RegistroEntregaDTO dto) {
        for (var producto : dto.getProductos()) {
            if (producto.getCantidad_kg() != null && producto.getCantidad_kg() > 0) {
                descontarInventarioProductoIndividual(producto);
            }
        }
    }

    /**
     * Verificar si hay stock suficiente antes de procesar la entrega
     * @param dto
     * @throws RuntimeException si hay stock insuficiente
     */
    private void verificarStockSuficiente(RegistroEntregaDTO dto) {
        for (var producto: dto.getProductos()) {
            if (producto.getCantidad_kg() != null && producto.getCantidad_kg() > 0) {
                try {
                    ResponseEntity<Integer> response = inventarioServiceClient.getStockTotalProducto(producto.getId_producto());
                    Integer stockDisponible = response.getBody();
                    if (stockDisponible == null || stockDisponible < producto.getCantidad_kg().intValue()) {
                        throw new RuntimeException("Stock insuficiente para el producto " 
                            + producto.getNombreProducto() + ". Disponible: " 
                            + stockDisponible + " kg, Requerido: " 
                            + producto.getCantidad_kg() + " kg.");
                    }
                } catch(RuntimeException e) {
                    // Re-lanzar excepciones de negocio (stock insuficiente)
                    throw e;

                } catch (Exception e) {
                    // Solo atrapa errores técnicos (Feign, red, etc.)
                    log.error("Error al verificar stock del producto {}: {}", 
                        producto.getNombreProducto(), e.getMessage());
                    throw new RuntimeException("Error al verificar stock del producto: " + e.getMessage());
                }
            }
        }
    }

    /**
     * Descuenta el inventario de un producto individual.
     * @throws RuntimeException si el descuento falla
     */
    private void descontarInventarioProductoIndividual(ProductoEntregadoDTO producto) {
        try {
            Map<String, Object> datosDescuento = new HashMap<>();
            datosDescuento.put("descontarCantidad", producto.getCantidad_kg().intValue());
            
            log.debug("Descontando {} kg del producto ID: {}", 
                producto.getCantidad_kg(), producto.getId_producto());

            ResponseEntity<?> response = inventarioServiceClient.descontarInventario(
                producto.getId_producto(), 
                datosDescuento
            );

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Error al descontar inventario para producto ID: " 
                    + producto.getId_producto());
            }

            log.debug("Inventario descontado correctamente para: {}", producto.getNombreProducto());

        } catch (Exception e) {
            log.error("Error al descontar inventario del producto {}: {}", 
                producto.getNombreProducto(), e.getMessage());
            throw new RuntimeException("Error al descontar inventario: " + e.getMessage());
        }
    }

    /**
     * Envía email de confirmación si hay destinatario y productos entregados.
     * Los errores en el envío no interrumpen el proceso (entrega ya registrada).
     */
    private void enviarEmailConfirmacionSiPosible(RegistroEntregaDTO dto, DatosClientePrecios datosCliente) {
        if (datosCliente.email == null || datosCliente.nombre == null) {
            return;
        }

        try {
            List<ProductoEntregadoDTO> productosEntregados = filtrarProductosConCantidad(dto);
            
            if (productosEntregados.isEmpty()) {
                return;
            }

            double totalPedido = calcularTotalPedido(productosEntregados, datosCliente);
            String cuerpoHTML = generarCuerpoEmail(dto, productosEntregados, totalPedido, datosCliente);
            String asunto = "✅ Tu pedido #" + dto.getId_pedido() + " ha sido entregado";

            emailService.enviarEmailSimple(datosCliente.email, asunto, cuerpoHTML);
            
        } catch (Exception e) {
            log.warn("⚠️ Error al enviar correo (la entrega fue registrada correctamente): {}", 
                e.getMessage());
        }
    }

    /**
     * Filtra productos con cantidad mayor a cero.
     */
    private List<ProductoEntregadoDTO> filtrarProductosConCantidad(RegistroEntregaDTO dto) {
        return dto.getProductos().stream()
            .filter(p -> p.getCantidad_kg() != null && p.getCantidad_kg() > 0)
            .toList();
    }

    /**
     * Calcula el total del pedido sumando precio * cantidad de todos los productos.
     */
    private double calcularTotalPedido(
            List<ProductoEntregadoDTO> productos, 
            DatosClientePrecios datosCliente) {
        
        return productos.stream()
            .mapToDouble(p -> {
                double precio = p.getTipoProducto().equalsIgnoreCase("CORRIENTE") 
                    ? datosCliente.precioCorriente 
                    : datosCliente.precioEspecial;
                return p.getCantidad_kg() * precio;
            })
            .sum();
    }

    /**
     * Genera el HTML del email de confirmación.
     */
    private String generarCuerpoEmail(
            RegistroEntregaDTO dto,
            List<ProductoEntregadoDTO> productos,
            double totalPedido,
            DatosClientePrecios datosCliente) {
        
        return emailTemplateGenerator.generarEmailEntregaPedido(
            datosCliente.nombre,
            dto.getId_pedido(),
            productos,
            totalPedido,
            dto.getComentario(),
            dto.getHora_entregada(),
            datosCliente.precioCorriente,
            datosCliente.precioEspecial
        );
    }

    /**
     * Clase interna para encapsular datos del cliente y precios.
     */
    private record DatosClientePrecios(
        String email,
        String nombre,
        Double precioCorriente,
        Double precioEspecial
    ) {}

    /**
     * Obtener historial de entregas de un cliente
     */
    public List<RegistroEntrega> getHistorialEntregasCliente(Long idCliente) {
        return registroEntregaRepository.findByIdCliente(idCliente);
    }

    /**
     * Obtener entregas por ID de pedido
     */
    public List<RegistroEntrega> getEntregasByIdPedido(Long idPedido) {
        try {
            return registroEntregaRepository.findByIdPedido(idPedido);
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener entregas por idPedido: " + e.getMessage(), e);
        }
    }

    /**
     * Obtener todos los pedidos (sesiones de reparto)
     */
    public List<SesionReparto> getPedidos() {
        return sesionRepartoRepository.findAll();
    }

    /**
     * Eliminar todas las relaciones de un cliente antes de eliminarlo
     */
    @Transactional
    public void eliminarRelacionesCliente(Long idCliente) {
        try {
            log.info("Eliminando relaciones para el cliente ID: {}", idCliente);
            // Eliminar programaciones de entrega
            programacionEntregaRepository.deleteByIdCliente(idCliente);
            
            // Eliminar registros de entregas
            registroEntregaRepository.deleteByIdCliente(idCliente);
            
            // Eliminar relaciones ruta-cliente
            rutaClienteRepository.deleteByIdCliente(idCliente);
            
        } catch (Exception e) {
            throw new RuntimeException("Error al eliminar relaciones del cliente: " + e.getMessage(), e);
        }
    }
}
