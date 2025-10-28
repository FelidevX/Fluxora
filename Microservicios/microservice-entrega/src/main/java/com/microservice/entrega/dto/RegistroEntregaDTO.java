package com.microservice.entrega.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegistroEntregaDTO {
    private Long id_ruta;
    private LocalDate fecha_programada;
    private Long id_pedido;
    private Long id_cliente;
    private LocalDateTime hora_entregada;
    private String comentario;
    private Double corriente_entregado;
    private Double especial_entregado;
    
    // Lista de productos entregados para descontar
    private List<ProductoEntregadoDTO> productos;
}
