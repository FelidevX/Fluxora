package com.microservice.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductoConRecetaDTO {
    private String nombre;
    private Double cantidad;
    private Double precio;
    private String estado;
    private String categoria;
    private String descripcion;
    private LocalDate fecha;
    private List<RecetaDTO> receta;
}
