package com.microservice.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecetaIngredienteResponseDTO {
    private Long id;
    private Long materiaPrimaId;
    private String materiaPrimaNombre;
    private Double cantidadNecesaria;
    private String unidad;
    private Boolean esOpcional;
    private String notas;
    // Precio Promedio Ponderado por unidad para la materia prima
    private Double ppp;
    // Costo parcial para este ingrediente (cantidadNecesaria * ppp)
    private Double costoParcial;
}