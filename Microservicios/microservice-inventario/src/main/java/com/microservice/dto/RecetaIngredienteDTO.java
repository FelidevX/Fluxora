package com.microservice.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecetaIngredienteDTO {
    private Long materiaPrimaId;
    private String materiaPrimaNombre;
    private Double cantidadNecesaria;
    private String unidad;
    private Boolean esOpcional;
    private String notas;
}