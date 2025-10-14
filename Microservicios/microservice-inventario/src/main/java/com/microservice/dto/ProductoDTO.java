package com.microservice.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductoDTO {
    private Long id;
    private String nombre;
    private Double cantidad;
    private Double precio;
    private String estado;
    private String categoria;
    private String descripcion;
    private LocalDate fecha;
    private List<RecetaDTO> receta;
    private Double costoProduccion; // Costo total basado en PPP de ingredientes
    private Double ganancia; // Ganancia = precio - costoProduccion
}
