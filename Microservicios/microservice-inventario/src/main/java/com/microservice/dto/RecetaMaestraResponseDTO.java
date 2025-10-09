package com.microservice.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecetaMaestraResponseDTO {
    private Long id;
    private String nombre;
    private String descripcion;
    private String categoria;
    private String unidadBase;
    private Double cantidadBase;
    private Double precioEstimado;
    private Double precioUnidad;
    private Integer tiempoPreparacion;
    private LocalDate fechaCreacion;
    private Boolean activa;
    private List<RecetaIngredienteResponseDTO> ingredientes;
}