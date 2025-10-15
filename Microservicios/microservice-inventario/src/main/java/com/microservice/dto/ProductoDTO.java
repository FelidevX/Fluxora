package com.microservice.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductoDTO {
    private Long id;
    private String nombre;
    private String estado; // activo, descontinuado
    private Double precioVenta;
    private String tipoProducto; // CORRIENTE, ESPECIAL, NO_APLICA
    private String categoria; // panaderia, pasteleria, etc.
    private Long recetaMaestraId; // ID de la receta asociada (opcional)
    
    // Campos calculados desde los lotes (no se guardan en BD)
    private Integer stockTotal; // Suma de stock_actual de todos los lotes
}
