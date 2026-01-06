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
     * Registrar una entrega (VENTA, MERMA o AJUSTE)
     */
    public void registrarEntrega(RegistroEntregaDTO dto) {
        try {
            // Establecer tipo por defecto si no viene especificado
            TipoMovimiento tipo = dto.getTipo() != null ? dto.getTipo() : TipoMovimiento.VENTA;
            
            // Obtener información del cliente (solo si es una VENTA)
            ClienteDTO cliente = null;
            String emailDestinatario = null;
            String nombreDestinatario = null;
            final Double precioCorriente;
            final Double precioEspecial;
            
            if (tipo == TipoMovimiento.VENTA && dto.getId_cliente() != null) {
                cliente = clienteServiceClient.getClienteById(dto.getId_cliente());
                emailDestinatario = cliente.getEmail();
                nombreDestinatario = cliente.getNombre();
                
                // Usar precios del DTO si están disponibles, sino usar precios del cliente
                precioCorriente = dto.getPrecio_corriente() != null 
                    ? dto.getPrecio_corriente() 
                    : cliente.getPrecioCorriente();
                precioEspecial = dto.getPrecio_especial() != null 
                    ? dto.getPrecio_especial() 
                    : cliente.getPrecioEspecial();
            } else {
                // Para MERMA y AJUSTE, precios en 0
                precioCorriente = 0.0;
                precioEspecial = 0.0;
            }

            // Calcular montos
            Double montoCorriente = (dto.getCorriente_entregado() != null ? dto.getCorriente_entregado() : 0.0) * precioCorriente;
            Double montoEspecial = (dto.getEspecial_entregado() != null ? dto.getEspecial_entregado() : 0.0) * precioEspecial;
            Double montoTotal = montoCorriente + montoEspecial;

            // Crear registro de entrega con montos calculados
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

            registroEntregaRepository.save(registroEntrega);

            System.out.println("✅ Entrega registrada - Tipo: " + tipo + " Total: $" + montoTotal + " (Corriente: $" + montoCorriente + ", Especial: $" + montoEspecial + ")");

            // Solo actualizar programación si es una VENTA con ruta
            if (tipo == TipoMovimiento.VENTA && dto.getId_ruta() != null && dto.getFecha_programada() != null) {
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

            // Solo descontar inventario y enviar email si es una VENTA
            if (tipo == TipoMovimiento.VENTA && dto.getProductos() != null) {
                for (var producto : dto.getProductos()) {
                    if (producto.getCantidad_kg() != null && producto.getCantidad_kg() > 0) {
                        try {
                            Map<String, Object> datosDescuento = new HashMap<>();
                            datosDescuento.put("descontarCantidad", producto.getCantidad_kg().intValue());
                            
                            System.out.println("Descontando " + producto.getCantidad_kg() + " kg del producto ID: " + producto.getId_producto());

                            ResponseEntity<?> response = inventarioServiceClient.descontarInventario(
                                producto.getId_producto(), 
                                datosDescuento
                            );

                            if (!response.getStatusCode().is2xxSuccessful()) {
                                throw new RuntimeException("Error al descontar inventario para producto ID: " + producto.getId_producto());
                            }

                            System.out.println("Inventario descontado correctamente para: " + producto.getNombreProducto());

                        } catch (Exception e) {
                            System.err.println("Error al descontar inventario del producto " + producto.getNombreProducto() + ": " + e.getMessage());
                            throw new RuntimeException("Error al descontar inventario: " + e.getMessage());
                        }
                    }
                }

                // Enviar email solo si es VENTA y hay cliente
                if (emailDestinatario != null && nombreDestinatario != null) {
                    try {
                        // Filtrar productos con cantidad mayor a cero
                        List<ProductoEntregadoDTO> productosEntregados = dto.getProductos().stream()
                                .filter(p -> p.getCantidad_kg() != null && p.getCantidad_kg() > 0)
                                .toList();

                        if (!productosEntregados.isEmpty()) {
                            // Calcular total del pedido
                            double totalPedido = productosEntregados.stream()
                                    .mapToDouble(p -> {
                                        double precio = p.getTipoProducto().equalsIgnoreCase("CORRIENTE") ? precioCorriente : precioEspecial;
                                        return p.getCantidad_kg() * precio;
                                    })
                                    .sum();

                            // Genera HTML del correo
                            String cuerpoHTML = emailTemplateGenerator.generarEmailEntregaPedido(
                                nombreDestinatario,
                                dto.getId_pedido(),
                                productosEntregados,
                                totalPedido,
                                dto.getComentario(),
                                dto.getHora_entregada(),
                                precioCorriente,
                                precioEspecial
                            );

                            // Asunto del correo
                            String asunto = "✅ Tu pedido #" + dto.getId_pedido() + " ha sido entregado";

                            emailService.enviarEmailSimple(emailDestinatario, asunto, cuerpoHTML);
                            
                        }
                    } catch (Exception e) {
                        System.err.println("⚠️ Error al enviar correo (la entrega fue registrada correctamente): " + e.getMessage());
                    }
                }
            }

        } catch (Exception e) {
            System.err.println("Error en registrarEntrega: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error al registrar entrega: " + e.getMessage());
        }
    }

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
            System.out.println("Eliminando relaciones para el cliente ID: " + idCliente);
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
