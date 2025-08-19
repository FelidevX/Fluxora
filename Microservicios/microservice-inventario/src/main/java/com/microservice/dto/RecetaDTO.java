package com.microservice.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecetaDTO {
    private Long materiaPrimaId;
    private String materiaPrimaNombre;
    private Double cantidadNecesaria;
    private String unidad;
}
