package com.microservice.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoteCompraDTO {
    private Long materiaPrimaId;
    private String materiaPrimaNombre; // Para mostrar en respuestas
    private Double cantidad;
    private Double costoUnitario;
    private String numeroLote;
    private String fechaVencimiento; // LocalDate como String para JSON
}
