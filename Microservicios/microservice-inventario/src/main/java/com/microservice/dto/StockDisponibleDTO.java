package com.microservice.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockDisponibleDTO {
    private Long materiaPrimaId;
    private String materiaPrimaNombre;
    private Double cantidadNecesaria;
    private Double stockDisponible;
    private Boolean suficiente;
    private String unidad;
}
