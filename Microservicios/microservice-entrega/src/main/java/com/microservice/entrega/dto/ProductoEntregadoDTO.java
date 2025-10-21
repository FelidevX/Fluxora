package com.microservice.entrega.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductoEntregadoDTO {
    private Long id_producto;
    private Long id_lote;
    private String nombreProducto;
    private String tipoProducto;
    private Double cantidad_kg;
}