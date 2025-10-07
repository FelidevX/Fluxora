package com.microservice.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecetaMaestraDTO {
    private String nombre;
    private String descripcion;
    private String categoria;
    private String unidadBase;
    private Double cantidadBase;
    private Double precioEstimado;
    private Double precioUnidad;
    private Integer tiempoPreparacion;
    private List<RecetaIngredienteDTO> ingredientes;
}